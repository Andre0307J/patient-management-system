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
import { Separator } from "@/components/ui/separator";
import { UserCircle, ContactRound, ShieldPlus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePatients } from "@/context/PatientContext";
import { uploadImage } from "@/lib/uploadImages";
import { useAuth } from "@/hooks/useAuth";
import { storage } from "@/config/firebase";

const steps = [
  { label: "Basic Info", icon: UserCircle },
  { label: "Emergency Contact", icon: ContactRound },
  { label: "Insurance & Admin", icon: ShieldPlus },
];

export default function AddPatientForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  // Temporary in-memory store to check for duplicates
  const { patients, addPatient } = usePatients();

  // Step 1
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [nationality, setNationality] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [observations, setObservations] = useState("");

  // Step 2
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");

  // Step 3
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicy, setInsurancePolicy] = useState("");
  const [patientStatus, setPatientStatus] = useState("");
  const [assignedDoctor, setAssignedDoctor] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!fullName.trim()) newErrors.fullName = "Full name is required.";
      if (!validateEmail(email))
        newErrors.email = "Please enter a valid email.";
      if (!phone.trim()) newErrors.phone = "Phone number is required.";
      if (!dob) newErrors.dob = "Date of birth is required.";
      if (!gender) newErrors.gender = "Please select a gender.";
      if (!address.trim()) newErrors.address = "Address is required.";
      if (!city.trim()) newErrors.city = "City is required.";
      if (!state.trim()) newErrors.state = "State is required.";
      if (!zip.trim()) newErrors.zip = "ZIP code is required.";
    }

    if (step === 1) {
      if (!emergencyName.trim())
        newErrors.emergencyName = "Contact name is required.";
      if (!emergencyPhone.trim())
        newErrors.emergencyPhone = "Contact phone is required.";
      if (!emergencyRelationship.trim())
        newErrors.emergencyRelationship = "Relationship is required.";
    }

    if (step === 2) {
      if (!patientStatus) newErrors.patientStatus = "Please select a status.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => prev - 1);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setIsLoading(true);

    try {
      // Check for duplicates
      const isDuplicate = patients.some(
        (p) => p.email === email.toLowerCase() || p.phone === phone,
      );

      if (isDuplicate) {
        toast.error("Patient record already exists.", {
          description:
            "A record with this email or phone number is already in the system.",
        });
        setIsLoading(false);
        return;
      }

      // Upload photo to Firebase Storage if one was selected
      let photoURL: string | null = null;
      if (photoPreview && user) {
        const response = await fetch(photoPreview);
        const blob = await response.blob();
        const file = new File([blob], "patient-photo.jpg", { type: blob.type });
        photoURL = await uploadImage(
          file,
          `hospitals/${user.uid}/patients/${Date.now()}-photo`, storage
        );
      }

      const newPatient = {
        photo: photoURL,
        fullName,
        email: email.toLowerCase(),
        phone,
        dob,
        gender,
        address,
        city,
        state,
        zip,
        nationality,
        bloodType,
        allergies,
        medications,
        conditions,
        emergencyName,
        emergencyPhone,
        emergencyRelationship,
        insuranceProvider,
        insurancePolicy,
        patientStatus,
        assignedDoctor,
        observations,
      };

      await addPatient(newPatient);

      toast.success("New patient added successfully.", {
        description: `${fullName} has been added to the system.`,
      });

      onSuccess();
    } catch (error) {
      toast.error("Failed to add patient.", {
        description: "Please check your connection and try again.",
      });
      console.error("Add patient error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-5">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors",
                    isCompleted
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-gray-300 text-gray-400",
                  )}
                >
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-blue-600"
                        : "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <Separator
                  className={cn(
                    "flex-1 mx-2 mb-4",
                    index < currentStep ? "bg-blue-600" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Step 1 — Basic Info */}
        {currentStep === 0 && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <UserCircle size={52} className="text-gray-300" />
                )}
              </div>
              <label className="text-sm text-blue-600 cursor-pointer hover:underline">
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Full Name</Label>
                <Input
                  placeholder="John Doe"
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
                  placeholder="patient@example.com"
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
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    if (e.target.value)
                      setErrors((p) => ({ ...p, dob: undefined! }));
                  }}
                />
                {errors.dob && (
                  <p className="text-red-500 text-xs">{errors.dob}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select
                  onValueChange={(val) => {
                    setGender(val);
                    setErrors((p) => ({ ...p, gender: undefined! }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-xs">{errors.gender}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Street Address</Label>
                <Input
                  placeholder="123 Main St"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (e.target.value.trim())
                      setErrors((p) => ({ ...p, address: undefined! }));
                  }}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs">{errors.address}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input
                  placeholder="New York"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (e.target.value.trim())
                      setErrors((p) => ({ ...p, city: undefined! }));
                  }}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs">{errors.city}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input
                  placeholder="NY"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    if (e.target.value.trim())
                      setErrors((p) => ({ ...p, state: undefined! }));
                  }}
                />
                {errors.state && (
                  <p className="text-red-500 text-xs">{errors.state}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>ZIP Code</Label>
                <Input
                  placeholder="10001"
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value);
                    if (e.target.value.trim())
                      setErrors((p) => ({ ...p, zip: undefined! }));
                  }}
                />
                {errors.zip && (
                  <p className="text-red-500 text-xs">{errors.zip}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Nationality</Label>
                <Input
                  placeholder="American"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Blood Type</Label>
                <Select onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>
                  Allergies{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. Penicillin, Peanuts"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>
                  Current Medications{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. Metformin 500mg"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>
                  Pre-existing Conditions{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. Diabetes, Hypertension"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>
                  Observations{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <textarea
                  placeholder="e.g. Patient appears anxious, slight fever observed..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Emergency Contact */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Contact Full Name</Label>
              <Input
                placeholder="Jane Doe"
                value={emergencyName}
                onChange={(e) => {
                  setEmergencyName(e.target.value);
                  if (e.target.value.trim())
                    setErrors((p) => ({ ...p, emergencyName: undefined! }));
                }}
              />
              {errors.emergencyName && (
                <p className="text-red-500 text-xs">{errors.emergencyName}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Contact Phone</Label>
              <Input
                placeholder="+1 234 567 8900"
                value={emergencyPhone}
                onChange={(e) => {
                  setEmergencyPhone(e.target.value);
                  if (e.target.value.trim())
                    setErrors((p) => ({ ...p, emergencyPhone: undefined! }));
                }}
              />
              {errors.emergencyPhone && (
                <p className="text-red-500 text-xs">{errors.emergencyPhone}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Relationship to Patient</Label>
              <Select
                onValueChange={(val) => {
                  setEmergencyRelationship(val);
                  setErrors((p) => ({
                    ...p,
                    emergencyRelationship: undefined!,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Spouse",
                    "Parent",
                    "Sibling",
                    "Child",
                    "Friend",
                    "Guardian",
                    "Other",
                  ].map((r) => (
                    <SelectItem key={r} value={r.toLowerCase()}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.emergencyRelationship && (
                <p className="text-red-500 text-xs">
                  {errors.emergencyRelationship}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3 — Insurance & Admin */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>
                Insurance Provider{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. Blue Cross Blue Shield"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>
                Insurance Policy Number{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. BCB-123456789"
                value={insurancePolicy}
                onChange={(e) => setInsurancePolicy(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Patient Status</Label>
              <Select
                onValueChange={(val) => {
                  setPatientStatus(val);
                  setErrors((p) => ({ ...p, patientStatus: undefined! }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
              {errors.patientStatus && (
                <p className="text-red-500 text-xs">{errors.patientStatus}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>
                Assigned Doctor{" "}
                <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. Dr. Sarah Johnson"
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          {currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="cursor-pointer hover:bg-[#7bf500] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? "Saving Patient..." : "Save Patient"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
