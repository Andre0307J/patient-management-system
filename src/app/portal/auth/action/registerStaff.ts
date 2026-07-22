"use server";

import { adminAuth, adminDb } from "@/config/firebaseAdmin";
import * as nodemailer from "nodemailer";

export async function registerStaffAction(data: {
  fullName: string;
  email: string;
  password: string;
  inviteCode: string;
}) {
  const { fullName, email, password, inviteCode } = data;
  const formattedCode = inviteCode.trim().toUpperCase();

  try {
    // 1. Validate Invite Code
    const codeRef = adminDb.collection("InviteCodes").doc(formattedCode);
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      return { success: false, error: "Invalid invite code." };
    }

    const codeData = codeSnap.data();
    if (codeData?.used) {
      return { success: false, error: "This invite code has already been used." };
    }

    if (new Date() > new Date(codeData?.expiresAt)) {
      return { success: false, error: "This invite code has expired." };
    }

    const targetHospitalId = codeData?.hospitalId;
    const role = codeData?.role;

    // 2. Create User via Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false,
    });

    // 3. Write Firestore Records atomically
    const batch = adminDb.batch();

    batch.update(codeRef, {
      used: true,
      usedBy: userRecord.uid,
      claimedAt: new Date().toISOString(),
    });

    const userProfileRef = adminDb
      .collection("Hospitals")
      .doc(targetHospitalId)
      .collection("portalUsers")
      .doc(userRecord.uid);

    batch.set(userProfileRef, {
      fullName,
      email: email.toLowerCase(),
      role,
      hospitalId: targetHospitalId,
      assignedPatients: [],
      status: "active",
      createdAt: new Date().toISOString(),
    });

    const indexRef = adminDb
      .collection("PortalUserIndex")
      .doc(userRecord.uid);

    batch.set(indexRef, {
      hospitalId: targetHospitalId,
      role,
      createdAt: new Date().toISOString(),
    });

    await batch.commit();

    // 4. Generate email verification link targeting YOUR portal action handler
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      email,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/auth/action`,
        handleCodeInApp: false,
      }
    );

    // 5. Send Email via Nodemailer
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("EMAIL_USER or EMAIL_PASSWORD missing from env vars. Email not sent.");
      return { success: true, email, warning: "User created, but email server credentials are missing." };
    }

    const transporter = nodemailer.createTransport({
      service: "yahoo",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use a Yahoo App Password, NOT your regular password
      },
    });

    await transporter.sendMail({
      from: `"PatientCare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your PatientCare Portal email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f766e;">Welcome to PatientCare Portal!</h2>
          <p>Hi ${fullName},</p>
          <p>You've been invited to join the PatientCare clinical portal as a <strong>${role}</strong>.</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationLink}" 
             style="display: inline-block; background-color: #0f766e; color: white; 
                    padding: 12px 24px; border-radius: 6px; text-decoration: none;
                    font-weight: bold; margin: 16px 0;">
            Verify Email Address
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            After verifying, you'll be redirected to the portal login page where you can sign in with your credentials.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    return { success: true, email };
  } catch (error: unknown) {
    console.error("Staff registration server error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to complete registration.",
    };
  }
}