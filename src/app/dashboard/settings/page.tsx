"use client";

import { signOut } from "firebase/auth";
import { auth, storage, db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useHospital } from "@/context/HospitalContext";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  deleteDoc,
  collection,
  getDoc,
  updateDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Lock,
  Bell,
  Monitor,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
  Save,
  Building2,
  Upload,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrency, countryCurrencyMap } from "@/context/CurrencyContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { uploadImage } from "@/lib/uploadImages";

const sections = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "hospital", label: "Hospital", icon: Building2 },
  { id: "password", label: "Change Password", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "system", label: "System", icon: Monitor },
  { id: "account", label: "Account", icon: Trash2 },
];

const languageMap: Record<string, string> = {
  en: "english",
  es: "spanish",
  fr: "french",
  ar: "arabic",
  pt: "portuguese",
};

const languageLabels: Record<string, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  arabic: "Arabic",
  portuguese: "Portuguese",
};

function HospitalBrandingForm({
  hospitalId,
  currentHospitalName,
  currentLogoURL,
}: {
  hospitalId: string;
  currentHospitalName: string;
  currentLogoURL: string | null;
}) {
  const { user } = useAuth();
  const [isSavingHospital, setIsSavingHospital] = useState(false);
  const [hospitalNameEdit, setHospitalNameEdit] = useState(currentHospitalName);
  const [hospitalLogoFile, setHospitalLogoFile] = useState<File | null>(null);
  const [hospitalLogoPreview, setHospitalLogoPreview] = useState(currentLogoURL);

  const handleHospitalLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHospitalLogoFile(file);
    if (hospitalLogoPreview?.startsWith("blob:")) URL.revokeObjectURL(hospitalLogoPreview);
    setHospitalLogoPreview(URL.createObjectURL(file));
  };

  const handleHospitalSave = async () => {
  if (!user || !hospitalId) return;
  setIsSavingHospital(true);

  try {
    const trimmedNewName = hospitalNameEdit.trim();
    const updates: Record<string, string> = {};

    // Handle logo upload first
    if (hospitalLogoFile) {
      const storageRef = ref(
        storage,
        `hospitals/${trimmedNewName}/logo/${hospitalLogoFile.name}`
      );
      await uploadBytes(storageRef, hospitalLogoFile);
      const newLogoURL = await getDownloadURL(storageRef);
      updates.logoURL = newLogoURL;
    }

    // If hospital name hasn't changed, just update the fields
    if (trimmedNewName === hospitalId) {
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "Hospitals", hospitalId), {
          ...updates,
          hospitalName: trimmedNewName,
        });
      }
      toast.success("Hospital branding updated.");
      setIsSavingHospital(false);
      return;
    }

    // Hospital name changed — need to migrate the document
    // Step 1 — Get existing hospital data
    const oldDocSnap = await getDoc(doc(db, "Hospitals", hospitalId));
    if (!oldDocSnap.exists()) {
      toast.error("Hospital document not found.");
      setIsSavingHospital(false);
      return;
    }

    const existingData = oldDocSnap.data();

    // Step 2 — Check new name isn't already taken
    const newDocSnap = await getDoc(doc(db, "Hospitals", trimmedNewName));
    if (newDocSnap.exists()) {
      toast.error("A hospital with this name already exists.");
      setIsSavingHospital(false);
      return;
    }

    // Step 3 — Create new hospital document with new name
    await setDoc(doc(db, "Hospitals", trimmedNewName), {
      ...existingData,
      ...updates,
      hospitalName: trimmedNewName,
    });

    // Step 4 — Copy all subcollections to the new document
    const subcollections = [
      "patients",
      "appointments",
      "staff",
      "billing",
      "notifications",
      "portalUsers",
    ];

    for (const sub of subcollections) {
      const colSnap = await getDocs(
        collection(db, "Hospitals", hospitalId, sub)
      );
      for (const docSnap of colSnap.docs) {
        await setDoc(
          doc(db, "Hospitals", trimmedNewName, sub, docSnap.id),
          docSnap.data()
        );
        // For patients — also copy clinicalRecords subcollection
        if (sub === "patients") {
          const recordsSnap = await getDocs(
            collection(db, "Hospitals", hospitalId, "patients", docSnap.id, "clinicalRecords")
          );
          for (const record of recordsSnap.docs) {
            await setDoc(
              doc(db, "Hospitals", trimmedNewName, "patients", docSnap.id, "clinicalRecords", record.id),
              record.data()
            );
          }
        }
      }
    }

    // Step 5 — Update HospitalIndex to point to new name
    await updateDoc(doc(db, "HospitalIndex", user.uid), {
      hospitalName: trimmedNewName,
    });

    // Step 6 — Delete old hospital document and subcollections
    for (const sub of subcollections) {
      const colSnap = await getDocs(
        collection(db, "Hospitals", hospitalId, sub)
      );
      for (const docSnap of colSnap.docs) {
        if (sub === "patients") {
          const recordsSnap = await getDocs(
            collection(db, "Hospitals", hospitalId, "patients", docSnap.id, "clinicalRecords")
          );
          for (const record of recordsSnap.docs) {
            await deleteDoc(
              doc(db, "Hospitals", hospitalId, "patients", docSnap.id, "clinicalRecords", record.id)
            );
          }
        }
        await deleteDoc(doc(db, "Hospitals", hospitalId, sub, docSnap.id));
      }
    }

    await deleteDoc(doc(db, "Hospitals", hospitalId));

    toast.success("Hospital name updated successfully.", {
      description: `Hospital renamed to "${trimmedNewName}".`,
    });

    // Reload to pick up the new hospitalId from HospitalContext
    window.location.reload();

  } catch (error) {
    toast.error("Failed to update hospital branding.");
    console.error("Hospital branding error:", error);
  } finally {
    setIsSavingHospital(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Hospital Branding</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your hospital name and logo. These appear across the dashboard, portal and printed documents.
        </p>
      </div>
      <Separator />

      <div className="space-y-5 max-w-md">
        <div className="space-y-2">
          <Label>Hospital Logo</Label>
          <div className="flex items-center gap-3">
            {hospitalLogoPreview ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 bg-gray-50 dark:bg-gray-800">
                <Image
                  src={hospitalLogoPreview}
                  alt="Hospital logo"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0 bg-gray-50 dark:bg-gray-800">
                <Upload size={20} className="text-gray-400" />
              </div>
            )}
            <label className="flex-1 cursor-pointer">
              <div className="h-9 px-3 rounded-md border border-border bg-muted flex items-center text-sm text-muted-foreground hover:bg-accent transition truncate">
                {hospitalLogoFile ? hospitalLogoFile.name : "Choose new logo..."}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHospitalLogoChange}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended: PNG with transparent background, min 256×256px.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="hospitalName">Hospital Name</Label>
          <Input
            id="hospitalName"
            value={hospitalNameEdit}
            onChange={(e) => setHospitalNameEdit(e.target.value)}
            placeholder="St. Mary Hospital"
          />
          <p className="text-xs text-muted-foreground">
            This name appears in the sidebar, portal header and printed documents.
          </p>
        </div>
      </div>

      <Button onClick={handleHospitalSave} className="gap-2 cursor-pointer" disabled={isSavingHospital}>
        <Save size={14} /> {isSavingHospital ? "Saving..." : "Save Hospital Branding"}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { user } = useAuth();
  const { country, saveCountry, currency, symbol } = useCurrency();
  const { hospitalId, hospitalName: currentHospitalName, logoURL: currentLogoURL } = useHospital();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  // Profile
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role] = useState("Administrator");
  const hasInitialized = useRef(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Notifications
  const [notifyNewPatient, setNotifyNewPatient] = useState(true);
  const [notifyAppointment, setNotifyAppointment] = useState(true);
  const [notifyBilling, setNotifyBilling] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Theme
  const { theme, setTheme } = useTheme();

  // Date format
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  // Language banner logic
  const [language, setLanguage] = useState("english");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [showLanguageBanner, setShowLanguageBanner] = useState(false);
  const initialLanguage = useRef(language);

  // Sync form with user data
  useEffect(() => {
    if (user && !hasInitialized.current) {
      setFullName(user.displayName || "");
      setEmail(user.email || "");
      setPhone(user.phoneNumber || "");
      hasInitialized.current = true;

      const loadPreferences = async () => {
        try {
          if (!hospitalId) return;
          const hospitalDoc = await getDoc(doc(db, "Hospitals", hospitalId));
          if (hospitalDoc.exists()) {
            const data = hospitalDoc.data();
            // Load avatar
            if (data.photoURL) setPhotoPreview(data.photoURL);
            else if (user.photoURL) setPhotoPreview(user.photoURL);
            // Load preferences
            if (data.preferences) {
              if (data.preferences.theme) setTheme(data.preferences.theme);
              if (data.preferences.dateFormat) setDateFormat(data.preferences.dateFormat);
            }
          }
        } catch (error) {
          console.error("Error loading preferences:", error);
        }
      };
      loadPreferences();
    }
  }, [user, setTheme, hospitalId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // Language detection
  useEffect(() => {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    const mapped = languageMap[browserLang];
    if (mapped && mapped !== initialLanguage.current) {
      const timer = setTimeout(() => {
        setDetectedLanguage(mapped);
        setShowLanguageBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Photo Change Handler — convert to Base64 for persistence
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Profile Save Handler
  const handleProfileSave = async () => {
    if (!user || !hospitalId) return;
    setIsSavingProfile(true);
    try {
      let photoURL = user.photoURL;

      if (photoPreview && photoPreview !== user.photoURL) {
        const response = await fetch(photoPreview);
        const blob = await response.blob();
        const file = new File([blob], "avatar.jpg", { type: blob.type });
        // Use hospitalId (hospital name) in storage path
        photoURL = await uploadImage(
          file,
          `hospitals/${hospitalId}/avatar/profile-photo`,
          storage,
        );
      }

      await updateProfile(user, {
        displayName: fullName,
        photoURL: photoURL ?? undefined,
      });

      await updateDoc(doc(db, "Hospitals", hospitalId), {
        photoURL: photoURL,
      });

      toast.success("Profile updated.", {
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      toast.error("Failed to update profile.", {
        description: "Please check your connection and try again.",
      });
      console.error("Profile update error:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Current password is required.";
    if (!newPassword) errors.newPassword = "New password is required.";
    if (newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters.";
    if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordErrors({});
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password changed.", {
        description: "Your password has been updated successfully.",
      });
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      if (
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        setPasswordErrors({ currentPassword: "Current password is incorrect." });
      } else if (firebaseError.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Failed to change password.", {
          description: "Please check your connection and try again.",
        });
      }
      console.error("Password change error:", error);
    }
  };

  const handleNotificationSave = () => {
    toast.success("Notification preferences saved.", {
      description: "Your notification settings have been updated.",
    });
  };

  // Fixed: use hospitalId instead of user.uid
  const handleSystemSave = async () => {
    if (!user || !hospitalId) return;
    try {
      await saveCountry(country);
      await updateDoc(doc(db, "Hospitals", hospitalId), {
        preferences: {
          theme: theme || "light",
          dateFormat,
          country,
        },
      });
      toast.success("System settings saved.", {
        description: "Your system preferences have been updated.",
      });
    } catch (error) {
      toast.error("Failed to save system settings.");
      console.error("System settings error:", error);
    }
  };

  // Fixed: use hospitalId instead of user.uid, also delete HospitalIndex
  const handleDeleteAccount = async () => {
    if (!user || !hospitalId) return;
    setShowDeleteDialog(false);

    try {
      const subcollections = [
        "patients", "appointments", "staff", "billing",
        "notifications", "portalUsers",
      ];

      for (const subcollection of subcollections) {
        const colRef = collection(db, "Hospitals", hospitalId, subcollection);
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map((d) =>
          deleteDoc(doc(db, "Hospitals", hospitalId, subcollection, d.id))
        );
        await Promise.all(deletePromises);
      }

      // Delete hospital document
      await deleteDoc(doc(db, "Hospitals", hospitalId));

      // Delete HospitalIndex (uid → hospitalName lookup)
      await deleteDoc(doc(db, "HospitalIndex", user.uid));

      // Delete Firebase Auth account
      await deleteUser(user);

      toast.success("Account deleted.", {
        description: "Your account and all data have been permanently deleted.",
      });

      window.location.href = "/admin/signup";
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === "auth/requires-recent-login") {
        toast.error("Please sign out and sign back in before deleting your account.", {
          description: "This is required for security purposes.",
        });
      } else {
        toast.error("Failed to delete account.", {
          description: "Please check your connection and try again.",
        });
      }
      console.error("Delete account error:", error);
    }
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await signOut(auth);
      toast.success("Signed out successfully.");
      window.location.href = "/admin";
    } catch (error) {
      toast.error("Failed to sign out. Please try again.");
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and system preferences.
        </p>
      </div>

      {/* Language Banner */}
      {showLanguageBanner && detectedLanguage && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-3 gap-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            We detected your system language is{" "}
            <span className="font-semibold capitalize">
              {languageLabels[detectedLanguage]}
            </span>
            . Would you like to switch?
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => {
                setLanguage(detectedLanguage);
                setShowLanguageBanner(false);
                toast.success("Language switched.", {
                  description: `Language set to ${languageLabels[detectedLanguage]}.`,
                });
              }}
            >
              Yes, Switch
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowLanguageBanner(false)}>
              No, Keep {languageLabels[language]}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Sidebar Nav */}
        <div className="w-full md:w-56 shrink-0">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex md:flex-col overflow-x-auto">
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <div key={section.id} className="shrink-0 md:w-full">
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <Icon size={16} />
                      {section.label}
                    </button>
                    {index < sections.length - 1 && (
                      <Separator className="hidden md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-card rounded-xl border border-border p-4 md:p-6">

          {/* ── Profile Settings ── */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Profile Settings</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Update your personal information.</p>
              </div>
              <Separator />

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center shrink-0">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Avatar"
                      fill
                      className="object-cover object-top"
                      unoptimized
                    />
                  ) : (
                    <UserCircle size={52} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <label htmlFor="avatar-upload" className="text-sm text-blue-600 cursor-pointer hover:underline">
                    Change Avatar
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div className="space-y-1">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={role} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
                </div>
              </div>

              <Button onClick={handleProfileSave} className="gap-2 cursor-pointer" disabled={isSavingProfile}>
                <Save size={14} /> {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}

          {/* ── Hospital Branding ── */}
          {activeSection === "hospital" && (
            <HospitalBrandingForm
              key={hospitalId}
              hospitalId={hospitalId}
              currentHospitalName={currentHospitalName}
              currentLogoURL={currentLogoURL}
            />
          )}

          {/* ── Change Password ── */}
          {activeSection === "password" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Change Password</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Make sure your password is strong and secure.</p>
              </div>
              <Separator />

              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <Label htmlFor="current-pass">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-pass"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      className="pr-10"
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (e.target.value) setPasswordErrors((p) => { const n = { ...p }; delete n.currentPassword; return n; });
                      }}
                    />
                    <button type="button" onClick={() => setShowCurrent((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && <p className="text-red-500 text-xs">{passwordErrors.currentPassword}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="new-pass">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      className="pr-10"
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (e.target.value.length >= 8) setPasswordErrors((p) => { const n = { ...p }; delete n.newPassword; return n; });
                      }}
                    />
                    <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className="text-red-500 text-xs">{passwordErrors.newPassword}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-pass">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-pass"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      className="pr-10"
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (e.target.value === newPassword) setPasswordErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n; });
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className="text-red-500 text-xs">{passwordErrors.confirmPassword}</p>}
                </div>

                <Button onClick={handlePasswordSave} className="gap-2">
                  <Save size={14} /> Update Password
                </Button>
              </div>
            </div>
          )}

          {/* ── Notification Preferences ── */}
          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Choose what you want to be notified about.</p>
              </div>
              <Separator />

              <div className="space-y-4 max-w-md">
                {[
                  { label: "New patient added", description: "Get notified when a new patient is added.", value: notifyNewPatient, onChange: setNotifyNewPatient },
                  { label: "Appointment scheduled", description: "Get notified when an appointment is booked.", value: notifyAppointment, onChange: setNotifyAppointment },
                  { label: "Billing & invoices", description: "Get notified when a new invoice is created.", value: notifyBilling, onChange: setNotifyBilling },
                  { label: "Email notifications", description: "Receive notifications via email.", value: notifyEmail, onChange: setNotifyEmail },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.onChange(!item.value)}
                      className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", item.value ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700")}
                    >
                      <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", item.value ? "left-5" : "left-0.5")} />
                    </button>
                  </div>
                ))}
              </div>

              <Button onClick={handleNotificationSave} className="gap-2">
                <Save size={14} /> Save Preferences
              </Button>
            </div>
          )}

          {/* ── System Settings ── */}
          {activeSection === "system" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">System Settings</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Customize how the app looks and behaves.</p>
              </div>
              <Separator />

              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <Label>Theme</Label>
                  <select
                    value={theme || "light"}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Choose how the app looks on your device.</p>
                </div>

                <div className="space-y-1">
                  <Label>Language</Label>
                  <div className="flex items-center justify-between h-9 px-3 rounded-md border border-border bg-muted">
                    <span className="text-sm text-foreground capitalize">{languageLabels[language]}</span>
                    <span className="text-xs text-muted-foreground">Auto-detected from your system</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="date-format">Date Format</Label>
                  <select
                    id="date-format"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="country-select">Country & Currency</Label>
                  <select
                    id="country-select"
                    value={country}
                    onChange={(e) => saveCountry(e.target.value)}
                    className="w-full h-9 px-3 text-sm rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {countryCurrencyMap.map((c) => (
                      <option key={c.country} value={c.country}>
                        {c.country} ({c.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Current currency: {currency} ({symbol})
                  </p>
                </div>
              </div>

              <Button onClick={handleSystemSave} className="gap-2">
                <Save size={14} /> Save Settings
              </Button>
            </div>
          )}

          {/* ── Account Management ── */}
          {activeSection === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">Account Management</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your account access and data.</p>
              </div>
              <Separator />

              <div className="space-y-4 max-w-md">
                {/* Sign Out */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Sign Out</p>
                    <p className="text-xs text-muted-foreground">Sign out of your current session.</p>
                  </div>
                  <Button variant="outline" className="gap-2 text-foreground" onClick={() => setShowLogoutDialog(true)}>
                    <LogOut size={14} /> Sign Out
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
                    <p className="text-xs text-red-400">Permanently delete your account and all data.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 text-red-500 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your current session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Yes, Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is{" "}
              <span className="font-semibold text-red-600">permanent and irreversible</span>.
              All your data including patients, appointments, billing records and staff will be
              permanently deleted. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}