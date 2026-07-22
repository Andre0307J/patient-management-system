"use client";

import { useEffect, useState } from "react";
import { portalAuth as auth } from "@/config/firebase";
import { sendEmailVerification, onAuthStateChanged, reload, signOut } from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function PortalVerificationSentCard() {
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }

      // If the user is already verified when entering this page
      if (user.emailVerified) {
        toast.success("Email verified successfully! Please log in.");
        await signOut(auth); // Clear active session on portalAuth
        window.location.href = "/portal"; // Redirect to the staff portal login
        return;
      }

      if (interval) clearInterval(interval);

      // Polling loop to check verification status every 5 seconds
      interval = setInterval(async () => {
        try {
          await reload(user);
          if (user.emailVerified) {
            clearInterval(interval);
            toast.success("Email verified successfully! Please log in.");
            await signOut(auth); // Clear active portal session
            window.location.href = "/portal"; // Redirect to staff portal login
          }
        } catch (error) {
          console.error("Error checking verification status:", error);
        }
      }, 5000);
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("No user found. Please sign up again.");
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-success`,
        handleCodeInApp: true,
      });
      toast.success("A new verification link has been sent!");
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Too many requests. Please wait a moment before trying again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/95 backdrop-blur-sm p-8 shadow-2xl text-center border border-white/20">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-600">
            We&apos;ve sent a verification link to your email address. Please click the link to verify your staff account.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
            <Loader2 size={14} className="animate-spin" />
            <span>Waiting for verification... this page will redirect automatically.</span>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-500 mb-4">
              Didn&apos;t receive the email or link expired?
            </p>
            <Button
              onClick={handleResend}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}