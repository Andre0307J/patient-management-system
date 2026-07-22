// Firebase Storage (uncomment when Blaze plan is activated) ────────────
//import { storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, FirebaseStorage } from "firebase/storage";

export async function uploadImage(
  file: File, 
  path: string, 
  storageInstance: FirebaseStorage
): Promise<string> {
  const storageRef = ref(storageInstance, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteImage(fileUrl: string, storageInstance: FirebaseStorage): Promise<void> {
  try {
    const storageRef = ref(storageInstance, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}

// ─── Local Base64 data URL (temporary — remove when Blaze plan is activated) ──
// export async function uploadImage(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }

// export async function deleteImage(): Promise<void> {
//   // No-op for local base64 data URLs
// }
// ─────────────────────────────────────────────────────────────────────────────