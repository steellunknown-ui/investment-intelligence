"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, Clock, CheckCircle, AlertTriangle, XCircle, Info, Shield } from "lucide-react";
import type { Alert } from "@/lib/types";

interface AlertStatusProps {
  alerts: Alert[];
  currentStatus: "active" | "warning" | "triggered";
  lastActivity?: string;
}

const statusIcons = {
  active: CheckCircle,
  warning: AlertTriangle,
  triggered: XCircle,
};

const statusColors = {
  active: "bg-green-50 border-green-200",
  warning: "bg-amber-50 border-amber-200",
  triggered: "bg-red-50 border-red-200",
};

const statusTextColors = {
  active: "text-green-600",
  warning: "text-amber-600",
  triggered: "text-red-600",
};

const statusMessages = {
  active: "Your account is active. No action needed.",
  warning: "We noticed reduced activity. Please log in to confirm.",
  triggered: "Inactivity detected. Nominees have been notified.",
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "security":
      return <Shield className="h-4 w-4" />;
    case "inactivity":
      return <Clock className="h-4 w-4" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

export function AlertStatus({
  alerts,
  currentStatus,
  lastActivity,
}: AlertStatusProps) {
  const StatusIcon = statusIcons[currentStatus];

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader
          title="Account Status"
          description="Current activity status"
        />
        <CardContent>
          <div
            className={`rounded-lg border p-4 ${statusColors[currentStatus]}`}
          >
            <div className="flex items-start gap-3">
              <StatusIcon
                className={`h-5 w-5 ${statusTextColors[currentStatus]}`}
              />
              <div>
                <p className="font-medium text-neutral-900 capitalize">
                  {currentStatus}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {statusMessages[currentStatus]}
                </p>
                {lastActivity && (
                  <p className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last activity: {lastActivity}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader
          title="Recent Alerts"
          description="Activity and system notifications"
        />
        <CardContent>
          {alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts"
              description="You're all caught up! There are no pending alerts."
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${alert.is_read ? "bg-neutral-50" : "bg-blue-50"
                    }`}
                >
                  <div className={`mt-0.5 ${alert.is_read ? "text-neutral-400" : "text-blue-500"}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${alert.is_read
                        ? "text-neutral-600"
                        : "text-neutral-900 font-medium"
                        }`}
                    >
                      {alert.title}
                    </p>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {alert.message}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!alert.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
