"use client";

import { useEffect } from "react";

export default function VerifySuccessPage() {
  useEffect(() => {
    // 1. Broadcast to Tab 1 that email verification succeeded
    const channel = new BroadcastChannel("auth_verification_channel");
    channel.postMessage({ type: "EMAIL_VERIFIED" });
    channel.close();

    // 2. Try to close the tab instantly when this page mounts
    window.close();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 text-center shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-950">Email Verified!</h2>
        <p className="text-gray-600">
          Congratulations, your account is ready! <br />
          This tab will close automatically. If it doesn&apos;t, please close it
          manually to return to your main window to log in.
        </p>
        <button
          onClick={() => window.close()}
          className="mt-4 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
        >
          Close This Tab
        </button>
      </div>
    </div>
  );
}