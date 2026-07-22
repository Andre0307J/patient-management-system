"use client";

import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
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
//import { useRouter } from "next/navigation";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};

    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully.");
      //router.push("/dashboard");
      window.location.href = "/dashboard"; // Force a full page reload to ensure the session is updated
    } catch (error: unknown) {
      const firebaseError = error as { code: string; message?: string };
      console.error("Error signing in:", firebaseError.message || error);
      const errorMessage =
        firebaseError.code === "auth/user-not-found"
          ? "No account was found for this email."
          : firebaseError.code === "auth/wrong-password"
            ? "Incorrect password. Please try again."
            : firebaseError.code === "auth/too-many-requests"
              ? "Too many attempts. Please wait and try again."
              : firebaseError.code === "auth/invalid-email"
                ? "Please enter a valid email address."
                : "Failed to sign in. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              required
            />
            {errors.password && (
              <p className="text-red-500 text-xs">{errors.password}</p>
            )}
          </div>
          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <Button
            type="submit"
            className="w-full cursor-pointer hover:bg-[#7bf500] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
