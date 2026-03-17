"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { User, Camera, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/supabase-browser";

interface ProfileSectionProps {
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/settings/profile');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          full_name: data.user.full_name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
        });
        
        // Check for Google OAuth avatar first
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.user_metadata?.picture) {
          setAvatarUrl(user.user_metadata.picture);
        } else {
          setAvatarUrl(data.user.avatar_url);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar_url);
        // Refresh the page to update header avatar
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
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
        }),
      });

      if (res.ok) {
        alert('Profile updated successfully');
        // Refresh to update header
        window.location.reload();
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

  return (
    <Card>
      <CardHeader
        title="Profile Information"
        description="Update your personal details"
      />
      <CardContent>
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar 
                src={avatarUrl} 
                alt="Profile Avatar" 
                size="lg"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
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
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Profile Photo
              </p>
              <p className="text-sm text-neutral-500">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
              placeholder="Your full name"
            />
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              disabled
              hint="Contact support to change email"
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+1 (555) 000-0000"
            hint="Used for SMS notifications and 2FA"
          />

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
