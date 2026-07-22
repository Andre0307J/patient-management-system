"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth, portalAuth } from "@/config/firebase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function AuthActionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState<"loading" | "reset_form" | "error" | "success">("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isPortalUser, setIsPortalUser] = useState(false);

  useEffect(() => {
    if (!mode || !oobCode) {
      toast.error("Invalid link.");
      // 👇 Hard reload out of the broken authentication process to avoid router hanging
      window.location.href = "/";
      return;
    }

    // Detect if this is a portal user by checking portalAuth first
    const detectAndHandle = async () => {
      if (mode === "verifyEmail") {
        // Try portal auth first, then fall back to admin auth
        try {
          await applyActionCode(portalAuth, oobCode);
          window.close();
          return;
        } catch {
          // Not a portal user, try admin auth
          try {
            await applyActionCode(auth, oobCode);
            window.close();
          } catch (error) {
            console.error("Verification error:", error);
            window.close();
          }
        }
      } else if (mode === "resetPassword") {
        // Try portal auth first
        try {
          await verifyPasswordResetCode(portalAuth, oobCode);
          setIsPortalUser(true);
          setStatus("reset_form");
          return;
        } catch {
          // Not a portal user, try admin auth
          try {
            await verifyPasswordResetCode(auth, oobCode);
            setIsPortalUser(false);
            setStatus("reset_form");
          } catch (error) {
            console.error("Reset code error:", error);
            setStatus("error");
            toast.error("Reset link is invalid or has expired.");
          }
        }
      }
    };

    detectAndHandle();
  }, [mode, oobCode]);

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
      const authInstance = isPortalUser ? portalAuth : auth;
      await confirmPasswordReset(authInstance, oobCode!, newPassword);
      setStatus("success");

      // Use different localStorage keys for admin vs portal
      if (isPortalUser) {
        localStorage.setItem("portalPasswordReset", "true");
      } else {
        localStorage.setItem("passwordReset", "true");
      }

      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" && mode !== "resetPassword") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Processing...</p>
          <p className="text-xs text-gray-400">This tab will close automatically.</p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <span className="text-red-600 text-3xl">✗</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Link Expired</h2>
          <p className="text-sm text-gray-500">
            This link is invalid or has expired. Please request a new one.
          </p>
          <Button
            onClick={() => router.replace(isPortalUser ? "/portal/forgot-password" : "/forgot-password")}
            className="w-full"
          >
            Request New Reset Link
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
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <p className="text-sm text-gray-700 font-medium">Password reset successfully!</p>
          <p className="text-xs text-gray-400">This tab will close automatically...</p>
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
              className={`w-full ${isPortalUser ? "bg-teal-600 hover:bg-teal-700" : ""}`}
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
        <Loader2 size={40} className="animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Processing...</p>
      </div>
    </main>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading authentication security layer...</p>
        </div>
      </main>
    }>
      <AuthActionContent />
    </Suspense>
  );
}