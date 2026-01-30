"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { INACTIVITY_PERIODS } from "@/lib/constants";
import { Clock, AlertTriangle } from "lucide-react";

interface InactivityConfigProps {
  config?: {
    enabled: boolean;
    periodDays: number;
    alertEmail: boolean;
    alertSms: boolean;
  };
  onSave?: (config: any) => void;
}

export function InactivityConfig({ config, onSave }: InactivityConfigProps) {
  const [localConfig, setLocalConfig] = useState({
    enabled: config?.enabled ?? true,
    periodDays: config?.periodDays ?? 30,
    alertEmail: config?.alertEmail ?? true,
    alertSms: config?.alertSms ?? false,
  });

  const handleChange = (key: string, value: any) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader
        title="Inactivity Detection"
        description="Configure how we detect and respond to account inactivity"
      />
      <CardContent>
        <div className="space-y-6">
          {/* Enable Toggle */}
          <Toggle
            checked={localConfig.enabled}
            onChange={(checked) => handleChange("enabled", checked)}
            label="Enable Inactivity Monitoring"
            description="We'll monitor your account activity and notify your nominees if you're inactive for an extended period."
          />

          {localConfig.enabled && (
            <>
              {/* Period Selection */}
              <div className="pl-14">
                <Select
                  label="Inactivity Period"
                  options={INACTIVITY_PERIODS.map((p) => ({
                    value: p.value.toString(),
                    label: p.label,
                  }))}
                  value={localConfig.periodDays.toString()}
                  onChange={(e) =>
                    handleChange("periodDays", parseInt(e.target.value))
                  }
                  hint="How long before we consider your account inactive"
                />
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4 pl-14">
                <p className="text-sm font-medium text-slate-700">
                  Notification Channels
                </p>
                <div className="space-y-3">
                  <Toggle
                    checked={localConfig.alertEmail}
                    onChange={(checked) => handleChange("alertEmail", checked)}
                    label="Email Notifications"
                    description="Receive alerts via email before inactivity triggers"
                  />
                  <Toggle
                    checked={localConfig.alertSms}
                    onChange={(checked) => handleChange("alertSms", checked)}
                    label="SMS Notifications"
                    description="Receive alerts via SMS (requires verified phone)"
                  />
                </div>
              </div>
            </>
          )}

          {/* Explanation */}
          <div className="rounded-lg bg-slate-50 p-4 mt-6">
            <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              How Inactivity Detection Works
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-slate-400">1.</span>
                <span>
                  We track your login activity and portfolio interactions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">2.</span>
                <span>
                  After {localConfig.periodDays / 2} days of no activity, you'll
                  receive a reminder
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">3.</span>
                <span>
                  After {localConfig.periodDays} days, nominees are notified
                  with read-only access
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">4.</span>
                <span>Any login immediately resets the inactivity counter</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-3 rounded-lg bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Legal Disclaimer</p>
              <p className="mt-1">
                This feature provides portfolio visibility to nominees but does
                not constitute legal transfer of assets. For estate planning,
                please consult with appropriate legal and financial advisors.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button onClick={() => onSave?.(localConfig)}>Save Changes</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
