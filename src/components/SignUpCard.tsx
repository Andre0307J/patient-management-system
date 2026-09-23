// Sign up card component for user registration with Firebase authentication and Firestore integration. It includes form validation, error handling, and email verification.

"use client";

import { useState } from "react";
import { Eye, EyeOff, Building2, Upload } from "lucide-react";
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
import { useCurrency, countryCurrencyMap } from "@/context/CurrencyContext";
import { auth, db, storage } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

export default function SignUpCard() {
  const [hospitalName, setHospitalName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    hospitalName?: string;
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const { country, setCountry } = useCurrency();
  const router = useRouter();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const getFirebaseErrorMessage = (error: {
    code: string;
    message?: string;
  }): string => {
    const errorMap: Record<string, string> = {
      "auth/email-already-in-use": "This email is already registered.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/operation-not-allowed": "Sign up is currently disabled.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
    };
    return (
      errorMap[error.code] ||
      error.message ||
      "An error occurred. Please try again."
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors: typeof errors = {};
  if (!hospitalName.trim()) newErrors.hospitalName = "Hospital name is required.";
  if (!fullName.trim()) newErrors.fullName = "Full name is required.";
  if (!validateEmail(email)) newErrors.email = "Please enter a valid email address.";
  if (password.length < 6) {
    newErrors.password = "Password must be at least 6 characters.";
  } else if (password !== confirmPassword) {
    newErrors.password = "Passwords do not match.";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setIsLoading(true);

  try {
    // Step 1 — Create Firebase Auth account FIRST
    // so the user is authenticated when querying Firestore
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredentials.user;

    try {
      // Step 2 — Check if hospital name already exists (user is now authenticated)
      const hospitalDocSnap = await getDoc(doc(db, "Hospitals", hospitalName.trim()));
      if (hospitalDocSnap.exists()) {
        // Rollback — delete auth account if hospital name is taken
        await user.delete();
        setErrors({ hospitalName: "A hospital with this name already exists." });
        setIsLoading(false);
        return;
      }

      // Step 3 — Upload logo to Firebase Storage if provided
      let logoURL: string | null = null;
      if (logoFile) {
        const storageRef = ref(
          storage,
          `hospitals/${hospitalName.trim()}/logo/${logoFile.name}`
        );
        await uploadBytes(storageRef, logoFile);
        logoURL = await getDownloadURL(storageRef);
      }

      // Step 4 — Create Hospitals document (document ID = hospital name)
      await setDoc(doc(db, "Hospitals", hospitalName.trim()), {
        hospitalName: hospitalName.trim(),
        logoURL,
        uid: user.uid,
        fullName,
        email: email.toLowerCase(),
        country,
        createdAt: new Date().toISOString(),
      });

      // Step 5 — Create HospitalIndex for uid → hospitalName lookup
      // This is the ONLY index needed for admins
      // NOTE: Do NOT create PortalUserIndex for admins — that is exclusively
      // for doctors and nurses who sign up via the portal invite code system
      await setDoc(doc(db, "HospitalIndex", user.uid), {
        hospitalName: hospitalName.trim(),
        createdAt: new Date().toISOString(),
      });

      window.localStorage.setItem(
        "patientcare-hospital-branding",
        JSON.stringify({ hospitalName: hospitalName.trim(), logoURL }),
      );

      // Step 6 — Send verification email
      await sendEmailVerification(user, {
        url: `${window.location.origin}/admin`,
      });

      toast.success("Account created!", {
        description: "Please check your email to verify your account.",
      });

      router.push("/admin/verification-sent");

    } catch (firestoreError) {
      // Rollback — delete auth account if Firestore writes fail
      await user.delete();
      throw firestoreError;
    }
  } catch (error: unknown) {
    const firebaseError = error as { code: string; message?: string };
    const errorMessage = getFirebaseErrorMessage(firebaseError);
    setErrors({ email: errorMessage });
    console.error("Sign-up error:", firebaseError.message || error);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Fill in the details below to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Hospital Name */}
          <div className="space-y-2">
            <Label htmlFor="hospitalName">Hospital Name</Label>
            <div className="relative">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                id="hospitalName"
                type="text"
                placeholder="St. Mary Hospital"
                value={hospitalName}
                className="pl-9"
                onChange={(e) => {
                  setHospitalName(e.target.value);
                  if (e.target.value.trim())
                    setErrors((p) => ({ ...p, hospitalName: undefined }));
                }}
              />
            </div>
            {errors.hospitalName && (
              <p className="text-red-500 text-xs">{errors.hospitalName}</p>
            )}
          </div>

          {/* Upload Logo */}
          <div className="space-y-2">
            <Label>
              Hospital Logo{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </Label>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                  <Upload size={18} className="text-gray-400" />
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <div className="h-9 px-3 rounded-md border border-gray-200 bg-gray-50 flex items-center text-sm text-gray-500 hover:bg-gray-100 transition">
                  {logoFile ? logoFile.name : "Choose logo image..."}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (e.target.value.trim())
                  setErrors((p) => ({ ...p, fullName: undefined }));
              }}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validateEmail(e.target.value))
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>

          {/* Password */}
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
                  if (confirmPassword && e.target.value === confirmPassword)
                    setErrors((p) => ({ ...p, password: undefined }));
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
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                className="pr-10"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value === password)
                    setErrors((p) => ({ ...p, password: undefined }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countryCurrencyMap.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country} ({c.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              This sets your default currency for billing and invoices.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
