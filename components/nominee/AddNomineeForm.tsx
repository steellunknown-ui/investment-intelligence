"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { RELATIONSHIP_OPTIONS, ACCESS_LEVELS } from "@/lib/constants";
import { AlertCircle } from "lucide-react";

interface AddNomineeFormProps {
  onSubmit: (data: NomineeFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface NomineeFormData {
  name: string;
  email: string;
  relationship: string;
  accessLevel: "view_only" | "limited";
}

export function AddNomineeForm({
  onSubmit,
  onCancel,
  loading = false,
}: AddNomineeFormProps) {
  const [formData, setFormData] = useState<NomineeFormData>({
    name: "",
    email: "",
    relationship: "",
    accessLevel: "view_only",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof NomineeFormData, string>>
  >({});

  const handleChange = (field: keyof NomineeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NomineeFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.relationship) {
      newErrors.relationship = "Please select a relationship";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Add Nominee"
        description="Add a trusted contact who can access your portfolio information"
      />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Disclaimer */}
          <div className="flex gap-3 rounded-lg bg-warning-50 p-4">
            <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-warning-800">
              <p className="font-medium">Important Information</p>
              <p className="mt-1">
                Nominees will receive read-only access to your portfolio
                information only after verification and in accordance with your
                inactivity settings. This is not a legal transfer of assets.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="Enter nominee's full name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="nominee@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
            />
          </div>

          <Select
            label="Relationship"
            placeholder="Select relationship"
            options={RELATIONSHIP_OPTIONS.map((r) => ({
              value: r.value,
              label: r.label,
            }))}
            value={formData.relationship}
            onChange={(e) => handleChange("relationship", e.target.value)}
            error={errors.relationship}
          />

          {/* Access Level Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Access Level
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {ACCESS_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                    formData.accessLevel === level.value
                      ? "border-accent-500 bg-accent-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="accessLevel"
                    value={level.value}
                    checked={formData.accessLevel === level.value}
                    onChange={(e) =>
                      handleChange(
                        "accessLevel",
                        e.target.value as "view_only" | "limited"
                      )
                    }
                    className="sr-only"
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        formData.accessLevel === level.value
                          ? "text-accent-900"
                          : "text-neutral-900"
                      }`}
                    >
                      {level.label}
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        formData.accessLevel === level.value
                          ? "text-accent-700"
                          : "text-neutral-500"
                      }`}
                    >
                      {level.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add Nominee
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
