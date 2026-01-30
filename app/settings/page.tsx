"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { User, Camera, Upload } from "lucide-react";

interface ProfileData {
  full_name: string;
  contact_number: string;
  gender: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  avatar_url: string | null;
}

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    contact_number: "",
    gender: "",
    date_of_birth: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    avatar_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, avatar_url: data.avatar_url }));
        // Refresh page to update header
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        alert('Profile updated successfully');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Settings" description="Manage your account settings">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Settings" description="Manage your account settings">
      <div className="space-y-6">
        {/* Profile Picture Card */}
        <Card>
          <CardHeader title="Profile Picture" description="Upload your profile photo" />
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Upload className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Profile Photo</p>
                <p className="text-sm text-slate-500">JPG, PNG or WEBP. Max 2MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card>
          <CardHeader title="Personal Information" description="Update your personal details" />
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name *"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
                <Input
                  label="Phone Number"
                  value={profile.contact_number}
                  onChange={(e) => setProfile(prev => ({ ...prev, contact_number: e.target.value }))}
                  placeholder="10 digit mobile number"
                  maxLength={10}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Gender"
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  options={GENDER_OPTIONS}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader title="Address Information" description="Update your address details" />
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Address"
                value={profile.address}
                onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address, apartment, suite, etc."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="City"
                  value={profile.city}
                  onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
                <Input
                  label="State"
                  value={profile.state}
                  onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Pincode"
                  value={profile.pincode}
                  onChange={(e) => setProfile(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="6 digit pincode"
                  maxLength={6}
                />
                <Input
                  label="Country"
                  value={profile.country}
                  onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
