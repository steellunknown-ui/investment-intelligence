"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Smartphone, Key, Clock } from "lucide-react";

export function SecuritySection() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        />
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50">
                <Smartphone className="h-5 w-5 text-accent-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Authenticator App
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Use an authenticator app to generate one-time codes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={twoFactorEnabled ? "success" : "default"}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              >
                {twoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader
          title="Password"
          description="Change your password regularly to keep your account secure"
        />
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <Key className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Password</p>
                <p className="text-sm text-neutral-500">
                  Last changed: —
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader
          title="Active Sessions"
          description="Manage your active sessions across devices"
        />
        <CardContent>
          <EmptyState
            icon={Clock}
            title="No active sessions data yet"
            description="Session tracking will appear here once implemented."
          />
        </CardContent>
      </Card>
    </div>
  );
}
