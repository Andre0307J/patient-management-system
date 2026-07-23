"use client";

import { useEffect, useState } from "react";
import { portalAuth as auth, portalDb } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, runTransaction } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FirebaseError {
  code: string;
  message?: string;
}

export default function PortalSignUpCard() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("code") || "";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  //PREFETCH ROUTE: Loads verification page assets in the background on mount
  useEffect(() => {
    router.prefetch("/portal/verification-sent");
  }, [router]);

  const validateEmail = (emailStr: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);

  const getFirebaseErrorMessage = (error: FirebaseError): string => {
    const errorMap: Record<string, string> = {
      "auth/email-already-in-use": "This email is already registered.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/operation-not-allowed": "Sign up is currently disabled.",
    };
    return (
      errorMap[error.code] ||
      error.message ||
      "An error occurred. Please try again."
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!validateEmail(email)) newErrors.email = "Please enter a valid email.";
    if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!inviteCode.trim()) newErrors.inviteCode = "Invite code is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const formattedCode = inviteCode.trim().toUpperCase();

      // Step 1 — Create Firebase Auth account FIRST
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredentials.user;

      try {
        // Step 2 — Direct Point Lookup in the top-level 'InviteCodes' collection
        const codeRef = doc(portalDb, "InviteCodes", formattedCode);

        // Step 3 — Execute Atomic Transaction
        await runTransaction(portalDb, async (transaction) => {
          const codeSnap = await transaction.get(codeRef);

          if (!codeSnap.exists()) {
            throw new Error("Invalid or expired invite code.");
          }

          const codeData = codeSnap.data();

          if (codeData.used === true) {
            throw new Error("This invite code has already been used.");
          }

          if (new Date() > new Date(codeData.expiresAt)) {
            throw new Error("This invite code has expired.");
          }

          const targetHospitalId = codeData.hospitalId;
          const role = codeData.role as "doctor" | "nurse";

          // Dynamic multi-tenant reference mapping
          const userProfileRef = doc(
            portalDb,
            "Hospitals",
            targetHospitalId,
            "portalUsers",
            user.uid,
          );

          // Mark code used
          transaction.update(codeRef, {
            used: true,
            usedBy: user.uid,
            claimedAt: new Date().toISOString(),
          });

          // Set user profile inside the correct hospital automatically
          transaction.set(userProfileRef, {
            fullName,
            email: email.toLowerCase(),
            role,
            hospitalId: targetHospitalId,
            assignedPatients: [],
            status: "active",
            createdAt: new Date().toISOString(),
          });

          const indexRef = doc(portalDb, "PortalUserIndex", user.uid);
          transaction.set(indexRef, {
            hospitalId: targetHospitalId,
            role,
            createdAt: new Date().toISOString(),
          });
        });

        // Step 4 — Send verification email with Auto-Close link for Tab 2
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-success`,
          handleCodeInApp: true,
        });

        toast.success("Account created!", {
          description: "Please check your email to verify your account.",
        });

        // Step 5 — Redirect directly to the verification sent page, maintaining the active session
        router.push("/portal/verification-sent");
      } catch (transactionError: unknown) {
        // Rollback Auth registration if database constraints fail
        await user.delete();
        console.error("Transaction error:", transactionError);

        const err = transactionError as Error;
        setErrors({
          inviteCode: err.message || "Failed to complete registration.",
        });
      }
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      const errorMessage = getFirebaseErrorMessage(firebaseError);
      setErrors({ email: errorMessage });
      console.error("Portal sign-up error:", firebaseError.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Join the Portal</CardTitle>
        <CardDescription>
          Enter your invite code to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              type="text"
              placeholder="XXXX-XXXX"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                if (e.target.value.trim())
                  setErrors((p) => ({ ...p, inviteCode: undefined! }));
              }}
              className="font-mono tracking-widest"
            />
            {errors.inviteCode && (
              <p className="text-red-500 text-xs">{errors.inviteCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Dr. John Smith"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (e.target.value.trim())
                  setErrors((p) => ({ ...p, fullName: undefined! }));
              }}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              placeholder="doctor@hospital.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validateEmail(e.target.value))
                  setErrors((p) => ({ ...p, email: undefined! }));
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                className="pr-10"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value.length >= 6)
                    setErrors((p) => ({ ...p, password: undefined! }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                className="pr-10"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value === password)
                    setErrors((p) => ({ ...p, confirmPassword: undefined! }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
