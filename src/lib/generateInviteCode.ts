import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface GenerateInviteCodeParams {
  hospitalId: string;
  role: "doctor" | "nurse";
}

function generateSegment(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, "0");
}

export async function generateStaffInviteCode({
  hospitalId,
  role,
}: GenerateInviteCodeParams): Promise<string> {
  try {
    // Generate code in XXXX-XXXX format
    const code = `${generateSegment()}-${generateSegment()}`;

    // 7 days expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Use setDoc with the `code` as document ID so PortalSignUpCard's point lookup finds it
    await setDoc(doc(db, "InviteCodes", code), {
      code,
      role,
      hospitalId,
      used: false,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString(),
    });

    return code;
  } catch (error) {
    console.error("Error generating invite code inside Firestore layer:", error);
    throw new Error("Failed to generate invite code. Please try again.");
  }
}