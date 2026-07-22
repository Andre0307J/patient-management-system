// Sign up card component for user registration with Firebase authentication and Firestore integration. It includes form validation, error handling, and email verification.

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
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
import { auth, db } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpCard() {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "english";
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const langMap: Record<string, string> = {
      en: "english",
      es: "spanish",
      fr: "french",
      ar: "arabic",
      pt: "portuguese",
    };
    return langMap[browserLang] || "english";
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { country, setCountry } = useCurrency();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      "auth/popup-closed-by-user": "Sign up was cancelled.",
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

    const newErrors: { fullName?: string; email?: string; password?: string } =
      {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

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
      // Create user in Firebase Auth
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredentials.user;

      try {
        // Step 2: Create profile in Firestore.
        await setDoc(doc(db, "Hospitals", user.uid), {
          fullName,
          email: email.toLowerCase(),
          country,
          language,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        // Rollback
        await user.delete();
        throw firestoreError;
      }

      // Step 3: Send verification email with custom ActionCodeSettings
      try {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-success`, // <-- Changed destination route
          handleCodeInApp: true, // <-- Dictates custom URL routing behavior
        });
        toast.success(
          "Account created! Please check your email for verification.",
        );
      } catch (emailError) {
        console.error("Verification email failed:", emailError);
        toast.error(
          "Account created, but the verification email failed. You can resend it from the next page.",
        );
      }

      // Redirect to verification pending page
      window.location.href = "/verification-sent";
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
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validateEmail(e.target.value)) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
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
                  if (confirmPassword && e.target.value === confirmPassword) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

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
                  if (e.target.value === password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <select
              name="languages"
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="arabic">Arabic</option>
              <option value="portuguese">Portuguese</option>
            </select>
            <p className="text-xs text-gray-400">
              Auto-detected from your browser. You can change this anytime in
              Settings.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select
              name="country"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countryCurrencyMap.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">
              This sets your default currency for billing and invoices.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}