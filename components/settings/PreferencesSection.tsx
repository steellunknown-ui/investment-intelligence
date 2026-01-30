"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";

export function PreferencesSection() {
  const [preferences, setPreferences] = useState({
    currency: "usd",
    timezone: "utc-5",
    language: "en",
    emailDigest: true,
    marketingEmails: false,
    pushNotifications: true,
  });

  const currencies = [
    { value: "usd", label: "USD ($)" },
    { value: "eur", label: "EUR (€)" },
    { value: "gbp", label: "GBP (£)" },
    { value: "inr", label: "INR (₹)" },
  ];

  const timezones = [
    { value: "utc-8", label: "Pacific Time (UTC-8)" },
    { value: "utc-5", label: "Eastern Time (UTC-5)" },
    { value: "utc+0", label: "UTC" },
    { value: "utc+5.5", label: "India Standard Time (UTC+5:30)" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
  ];

  return (
    <div className="space-y-6">
      {/* Display Preferences */}
      <Card>
        <CardHeader
          title="Display Preferences"
          description="Customize how information is displayed"
        />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Currency"
              options={currencies}
              value={preferences.currency}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
            />
            <Select
              label="Timezone"
              options={timezones}
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  timezone: e.target.value,
                }))
              }
            />
            <Select
              label="Language"
              options={languages}
              value={preferences.language}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  language: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader
          title="Notification Preferences"
          description="Control how you receive notifications"
        />
        <CardContent>
          <div className="space-y-4">
            <Toggle
              checked={preferences.emailDigest}
              onChange={(checked) =>
                setPreferences((prev) => ({ ...prev, emailDigest: checked }))
              }
              label="Weekly Email Digest"
              description="Receive a weekly summary of your portfolio performance"
            />
            <Toggle
              checked={preferences.pushNotifications}
              onChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  pushNotifications: checked,
                }))
              }
              label="Push Notifications"
              description="Receive important alerts on your device"
            />
            <Toggle
              checked={preferences.marketingEmails}
              onChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  marketingEmails: checked,
                }))
              }
              label="Marketing Emails"
              description="Receive updates about new features and tips"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>Save Preferences</Button>
      </div>
    </div>
  );
}
