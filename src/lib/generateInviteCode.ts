import { db } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";

interface GenerateInviteCodeProps {
  hospitalId: string; // CRITICAL: This must be the active Admin's Firebase Auth UID string
  role: "doctor" | "nurse";
}

export async function generateStaffInviteCode({ hospitalId, role }: GenerateInviteCodeProps) {
  try {
    // 1. Generate a clean, randomized 8-character string (e.g., 4WUQ-J9P5)
    const rawCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const formattedCode = `${rawCode.substring(0, 4)}-${rawCode.substring(4, 8)}`;

    // 2. Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Point directly to the new ROOT collection matching the rules
    const inviteCodeRef = doc(db, "InviteCodes", formattedCode);

    // 4. Save the schema definitions
    await setDoc(inviteCodeRef, {
      code: formattedCode,
      hospitalId: hospitalId, // Must perfectly match request.auth.uid in your rules
      role: role,
      used: false,
      usedBy: null,
      claimedAt: null,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return formattedCode; 

  } catch (error) {
    console.error("Error generating invite code inside Firestore layer:", error);
    throw new Error("Failed to generate invite code. Please try again.");
  }
}