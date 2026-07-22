"use client";

import { useState, useEffect, useRef } from "react";
import { usePortal } from "@/context/PortalContext";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserCircle, Save, Eye, EyeOff, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateDoc, doc } from "firebase/firestore";
import { portalDb } from "@/config/firebase";
import { uploadImage } from "@/lib/uploadImages";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Change Password", icon: Lock },
];

export default function PortalProfilePage() {
  const { portalUser } = usePortal();
  const { user } = usePortalAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // Profile
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const hasInitialized = useRef(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  // Navigate after save
  const router = useRouter();

  // Load user data
  useEffect(() => {
    if (user && !hasInitialized.current) {
      setFullName(user.displayName || portalUser?.fullName || "");
      setPhotoPreview(user.photoURL || null);
      hasInitialized.current = true;
    }
  }, [user, portalUser]);

  // Clean up object URLs automatically to prevent memory leaks when changing files or unmounting
  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Profile save handler
  const handleProfileSave = async () => {
    if (!user || !portalUser) return;
    try {
      let photoURL = user.photoURL;
      if (photoPreview && photoPreview !== user.photoURL) {
        const response = await fetch(photoPreview);
        const blob = await response.blob();
        const file = new File([blob], "portal-avatar.jpg", { type: blob.type });
        photoURL = await uploadImage(
          file,
          `hospitals/${portalUser.hospitalId}/portalUsers/${user.uid}/avatar`,
        );
      }
      await updateProfile(user, {
        displayName: fullName,
        photoURL: photoURL ?? undefined,
      });
      await updateDoc(
        doc(
          portalDb,
          "Hospitals",
          portalUser.hospitalId,
          "portalUsers",
          user.uid,
        ),
        {
          photo: photoURL,
          fullName,
        },
      );
      toast.success("Profile updated successfully.");
      router.push("/portal/dashboard");
    } catch (error) {
      toast.error("Failed to update profile.");
      console.error("Profile update error:", error);
    }
  };

  // Password save handler
  const handlePasswordSave = async () => {
    const errors: Record<string, string> = {};
    if (!currentPassword)
      errors.currentPassword = "Current password is required.";
    if (!newPassword) errors.newPassword = "New password is required.";
    if (newPassword.length < 6)
      errors.newPassword = "Password must be at least 6 characters.";
    if (newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    if (!user || !user.email) return;

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordErrors({});
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password changed successfully.");
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      if (
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        setPasswordErrors({
          currentPassword: "Current password is incorrect.",
        });
      } else {
        toast.error("Failed to change password. Please try again.");
      }
      console.error("Password change error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>
        <p className="text-gray-500 mt-1">
          Manage your portal account settings.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar Nav */}
        <div className="w-48 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    <Icon size={16} />
                    {section.label}
                  </button>
                  {index < sections.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Profile Settings
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Update your personal information.
                </p>
              </div>
              <Separator />

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center shrink-0">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Avatar"
                      fill
                      className="object-cover object-top"
                      sizes="256px"
                    />
                  ) : (
                    <UserCircle size={52} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="portal-avatar-upload"
                    className="text-sm text-teal-600 cursor-pointer hover:underline"
                  >
                    Change Avatar
                    <input
                      id="portal-avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400">
                    Email cannot be changed.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={portalUser?.role || ""}
                    disabled
                    className="bg-gray-50 text-gray-400 cursor-not-allowed capitalize"
                  />
                </div>
              </div>

              <Button
                onClick={handleProfileSave}
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                <Save size={14} /> Save Changes
              </Button>
            </div>
          )}

          {/* Password Section */}
          {activeSection === "password" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Change Password
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Make sure your password is strong and secure.
                </p>
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
                        if (e.target.value)
                          setPasswordErrors((p) => {
                            const n = { ...p };
                            delete n.currentPassword;
                            return n;
                          });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
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
                        if (e.target.value.length >= 6)
                          setPasswordErrors((p) => {
                            const n = { ...p };
                            delete n.newPassword;
                            return n;
                          });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs">
                      {passwordErrors.newPassword}
                    </p>
                  )}
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
                        if (e.target.value === newPassword)
                          setPasswordErrors((p) => {
                            const n = { ...p };
                            delete n.confirmPassword;
                            return n;
                          });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handlePasswordSave}
                  className="gap-2 bg-teal-600 hover:bg-teal-700"
                >
                  <Save size={14} /> Update Password
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}