"use client";

import { useState } from "react";
import { portalAuth as auth, portalDb as db } from "@/config/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
import Link from "next/link";

export default function PortalLoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};
    if (!validateEmail(email)) newErrors.email = "Please enter a valid email.";
    if (!password) newErrors.password = "Password is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. Check if email is verified
      if (!user.emailVerified) {
        toast.error("Please verify your email before logging in.");
        window.location.href = "/portal/verification-sent";
        return;
      }

      // 2. Fast direct lookup in PortalUserIndex to verify Staff status
      const indexDocRef = doc(db, "PortalUserIndex", user.uid);
      const indexDoc = await getDoc(indexDocRef);

      if (!indexDoc.exists()) {
        toast.error("Access denied. Admin accounts cannot log into the Staff Portal.");
        await signOut(auth); // Terminate session
        return;
      }

      toast.success("Signed in successfully.");
      window.location.href = "/portal/dashboard";
      
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      const message =
        firebaseError.code === "auth/user-not-found"
          ? "No account found with this email."
          : firebaseError.code === "auth/wrong-password" ||
              firebaseError.code === "auth/invalid-credential"
            ? "Incorrect password. Please try again."
            : firebaseError.code === "auth/too-many-requests"
              ? "Too many attempts. Please wait and try again."
              : "Failed to sign in. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Clinical Portal</CardTitle>
        <CardDescription>
          Sign in to access your patient records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  setErrors((p) => ({ ...p, email: undefined }));
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
                  if (e.target.value)
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
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              href="/portal/forgot-password"
              className="text-xs text-teal-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}