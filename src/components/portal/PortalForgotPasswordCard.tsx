"use client";

import { useState, useEffect } from "react";
import { portalAuth } from "@/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
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
import { toast } from "sonner";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
//import { useRouter } from "next/navigation";

export default function PortalForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  //const router = useRouter();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Poll for password reset completion
  useEffect(() => {
    if (!sent) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "portalPasswordReset" && e.newValue === "true") {
        localStorage.removeItem("portalPasswordReset");
        toast.success("Password reset successfully! Please sign in.");
        //router.replace("/portal");
        window.location.href = "/portal";
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [sent]); // add router as a dependency to ensure the effect runs when running app locally.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(portalAuth, email, {
        url: `${window.location.origin}/portal`,
      });
      setSent(true);
      toast.success("Password reset email sent!", {
        description: "Please check your inbox.",
      });
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      const message =
        firebaseError.code === "auth/user-not-found"
          ? "No account found with this email address."
          : firebaseError.code === "auth/too-many-requests"
            ? "Too many attempts. Please wait before trying again."
            : "Failed to send reset email. Please try again.";
      setError(message);
      console.error("Portal password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Mail size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Check your email
          </h2>
          <p className="text-sm text-gray-500">
            We sent a password reset link to{" "}
            <span className="font-medium text-gray-700">{email}</span>. Click
            the link to reset your password.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
            <Loader2 size={14} className="animate-spin" />
            <span>
              Waiting for password reset... this page will redirect
              automatically.
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Didn&apos;t receive it?{" "}
            <button
              onClick={() => setSent(false)}
              className="text-teal-600 hover:underline"
            >
              Try again
            </button>
          </p>
          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 text-sm text-teal-600 hover:underline mt-4"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
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
                if (error) setError("");
              }}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>

          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
