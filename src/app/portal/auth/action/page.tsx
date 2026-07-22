"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signOut,
} from "firebase/auth";
import { portalAuth } from "@/config/firebase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function PortalAuthActionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState<
    "loading" | "verify_success" | "reset_form" | "error" | "success"
  >("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!mode || !oobCode) {
      toast.error("Invalid link.");
      router.replace("/portal");
      return;
    }

    if (mode === "verifyEmail") {
      applyActionCode(portalAuth, oobCode)
        .then(async () => {
          // Clear active session state so the user logs in fresh on /portal
          await signOut(portalAuth);
          setStatus("verify_success");

          // Give user 2 seconds to see the success message before redirecting
          setTimeout(() => {
            window.location.href = "/portal";
          }, 2000);
        })
        .catch((error) => {
          console.error("Portal verification error:", error);
          setStatus("error");
          toast.error("Verification link is invalid or has expired.");
        });
    } else if (mode === "resetPassword") {
      verifyPasswordResetCode(portalAuth, oobCode)
        .then(() => {
          setStatus("reset_form");
        })
        .catch((error) => {
          console.error("Portal reset code error:", error);
          setStatus("error");
          toast.error("Reset link is invalid or has expired.");
        });
    } else {
      toast.error("Unknown action.");
      router.replace("/portal");
    }
  }, [mode, oobCode, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError("");
    setIsSubmitting(true);

    try {
      await confirmPasswordReset(portalAuth, oobCode!, newPassword);
      await signOut(portalAuth);
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/portal";
      }, 2000);
    } catch (error) {
      console.error("Portal password reset error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "verify_success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Email Verified!</h2>
          <p className="text-sm text-gray-500">
            Your staff email address has been verified successfully. Redirecting you to the portal login...
          </p>
          <Button onClick={() => (window.location.href = "/portal")} className="w-full bg-teal-600 hover:bg-teal-700">
            Go to Staff Login
          </Button>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle size={36} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Link Expired or Invalid</h2>
          <p className="text-sm text-gray-500">
            This link is invalid or has already been used. Please try logging in or requesting a new link.
          </p>
          <Button onClick={() => router.replace("/portal")} className="w-full bg-teal-600 hover:bg-teal-700">
            Back to Staff Portal
          </Button>
        </div>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>
          <p className="text-sm text-gray-700 font-medium">Password reset successfully!</p>
          <p className="text-xs text-gray-400">Redirecting you back to the portal login...</p>
        </div>
      </main>
    );
  }

  if (status === "reset_form") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-gray-800">Reset Your Password</h2>
            <p className="text-sm text-gray-500">Enter your new password below.</p>
          </div>
          <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
              />
              {passwordError && (
                <p className="text-red-500 text-xs">{passwordError}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={40} className="animate-spin text-teal-500" />
        <p className="text-sm text-gray-500">Processing verification...</p>
      </div>
    </main>
  );
}

export default function PortalAuthActionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="animate-spin text-teal-500" />
            <p className="text-sm text-gray-500">Loading portal handler...</p>
          </div>
        </main>
      }
    >
      <PortalAuthActionContent />
    </Suspense>
  );
}