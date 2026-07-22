"use server";

import { adminAuth } from "@/config/firebaseAdmin";

export async function resendVerificationAction(email: string) {
  try {
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      email,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/auth/action`,
        handleCodeInApp: false,
      }
    );

    // Send email — same transporter as registerStaff.ts
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "yahoo",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"PatientCare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your PatientCare Portal email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f766e;">Email Verification</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; background-color: #0f766e; color: white; 
                    padding: 12px 24px; border-radius: 6px; text-decoration: none;
                    font-weight: bold; margin: 16px 0;">
            Verify Email Address
          </a>
        </div>
      `,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Resend verification error:", error);
    return { success: false, error: (error as Error).message };
  }
}