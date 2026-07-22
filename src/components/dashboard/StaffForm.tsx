"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle } from "lucide-react";
import { usePatients, StaffMember } from "@/context/PatientContext";
import { uploadImage } from "@/lib/uploadImages";

import { toast } from "sonner";
import { deleteImage } from "@/lib/uploadImages";

const doctorRoles = [
  "Doctor",
  "Surgeon",
  "Specialist",
  "Consultant",
  "Resident",
];
const staffRoles = [
  "Nurse",
  "Admin",
  "Receptionist",
  "Lab Technician",
  "Pharmacist",
  "Cleaner",
  "Security",
  "Other",
];
const departments = [
  "Emergency",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Radiology",
  "Surgery",
  "ICU",
  "General",
  "Administration",
];

interface StaffFormProps {
  type: "doctor" | "staff";
  existing?: StaffMember;
  onSuccess: () => void;
}

export default function StaffForm({
  type,
  existing,
  onSuccess,
}: StaffFormProps) {
  const { staffMembers, addStaffMember, updateStaffMember } = usePatients();
  const { user } = useAuth();

  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existing?.photo ?? null,
  );
  const [fullName, setFullName] = useState(existing?.fullName ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [specialization, setSpecialization] = useState(
    existing?.specialization ?? "",
  );
  const [department, setDepartment] = useState(existing?.department ?? "");
  const [role, setRole] = useState(existing?.role ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(
    existing?.status ?? "active",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setisLoading] = useState(false);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!validateEmail(email)) newErrors.email = "Please enter a valid email.";
    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    if (!role) newErrors.role = "Please select a role.";
    if (!department) newErrors.department = "Please select a department.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle photo upload and preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up the memory allocated for the previous preview URL
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoPreview(URL.createObjectURL(file));
  };

  // Handle form submission
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isDuplicate = staffMembers.some(
      (s) =>
        s.id !== existing?.id &&
        s.type === type &&
        (s.email === email.toLowerCase() || s.phone === phone),
    );

    if (isDuplicate) {
      toast.error("Duplicate record detected.", {
        description: `A ${type} with this email or phone already exists.`,
      });
      return;
    }
    setisLoading(true);

    try {
      let photoURL: string | null = existing?.photo ?? null;

      // 1. Generate a definitive ID upfront if it's a new record
      // Using a clean alphanumeric format or pulling from crypto/timestamp
      const staffId =
        existing?.id ||
        `staff_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

      if (photoPreview && photoPreview !== existing?.photo) {
        if (existing?.photo) {
          await deleteImage(existing?.photo);
        }
        if (user?.uid) {
          const response = await fetch(photoPreview);
          const blob = await response.blob();
          const file = new File([blob], "staff-profile.jpg", {
            type: blob.type,
          });

          // 2. Use the stable staffId for the path
          const imagePath = `hospitals/${user.uid}/staff/${staffId}/profile.jpg`;
          photoURL = await uploadImage(file, imagePath);
        }
      }

      if (existing) {
        await updateStaffMember({
          ...existing,
          photo: photoURL,
          fullName,
          email: email.toLowerCase(),
          phone,
          specialization,
          department,
          role,
          status,
        });
        toast.success("Record updated.", {
          description: `${fullName}'s record has been successfully updated.`,
        });
      } else {
        // 3. Explicitly pass the same staffId down so context uses it as the document ID
        await addStaffMember(staffId, {
          photo: photoURL,
          fullName,
          email: email.toLowerCase(),
          phone,
          specialization,
          department,
          role,
          status,
          type,
          createdAt: new Date().toISOString(),
        });
        toast.success(`New ${type} added.`, {
          description: `${fullName} has been added to the system.`,
        });
      }
      onSuccess();
    } catch (error) {
      toast.error("Failed to save record.", {
        description: "Please check your connection and try again.",
      });
      console.error("Staff form error:", error);
    } finally {
      setisLoading(false);
    }
  };

  const roles = type === "doctor" ? doctorRoles : staffRoles;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 max-h-[65vh] overflow-y-auto pr-1"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="Preview"
              fill
              className="object-cover object-top"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <UserCircle size={52} className="text-gray-300" />
          )}
        </div>
        <label className="text-sm text-blue-600 cursor-pointer hover:underline">
          {existing ? "Change Photo" : "Upload Photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Full Name</Label>
          <Input
            placeholder="e.g. Dr. Sarah Johnson"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (e.target.value.trim())
                setErrors((p) => ({ ...p, fullName: undefined! }));
            }}
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Email</Label>
          <Input
            type="text"
            placeholder="doctor@hospital.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validateEmail(e.target.value))
                setErrors((p) => ({ ...p, email: undefined! }));
            }}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Phone</Label>
          <Input
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (e.target.value.trim())
                setErrors((p) => ({ ...p, phone: undefined! }));
            }}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Role</Label>
          <Select
            defaultValue={role}
            onValueChange={(val) => {
              setRole(val);
              setErrors((p) => ({ ...p, role: undefined! }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r.toLowerCase()}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
        </div>

        <div className="space-y-1">
          <Label>Department</Label>
          <Select
            defaultValue={department}
            onValueChange={(val) => {
              setDepartment(val);
              setErrors((p) => ({ ...p, department: undefined! }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department..." />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d.toLowerCase()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && (
            <p className="text-red-500 text-xs">{errors.department}</p>
          )}
        </div>

        <div className="col-span-2 space-y-1">
          <Label>
            Specialization{" "}
            <span className="text-gray-400 text-xs">(optional)</span>
          </Label>
          <Input
            placeholder="e.g. Cardiologist, Pediatrician"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />
        </div>

        <div className="col-span-2 space-y-1">
          <Label>Status</Label>
          <Select
            defaultValue={status}
            onValueChange={(val) => setStatus(val as "active" | "inactive")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full cursor-pointer hover:bg-[#7bf500] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
      >
        {
          existing
            ? isLoading
              ? "Saving Changes..."
              : "Save Changes" // Everything related to Editing
            : isLoading
              ? "Adding..."
              : `Add ${type === "doctor" ? "Doctor" : "Staff Member"}` // Everything related to Adding New
        }
      </Button>
    </form>
  );
}
