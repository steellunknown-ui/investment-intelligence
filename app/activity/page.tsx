"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Bell,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import type { Alert, InactivityConfig } from "@/lib/types";

export default function ActivityPage() {
  const [config, setConfig] = useState<InactivityConfig | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [inactivityDays, setInactivityDays] = useState("80");
  const [enabled, setEnabled] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/inactivity");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setInactivityDays(String(data.config.inactivity_days));
        setEnabled(data.config.enabled);
      }
    } catch (err) {
      console.error("Fetch config error:", err);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Fetch alerts error:", err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfig(), fetchAlerts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchConfig, fetchAlerts]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/inactivity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inactivity_days: Number(inactivityDays),
          enabled,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: "PATCH" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "security":
        return <Shield className="h-5 w-5" />;
      case "inactivity":
        return <Clock className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: string, isRead: boolean) => {
    if (isRead) return "text-neutral-400";
    switch (type) {
      case "security":
        return "text-red-500";
      case "inactivity":
        return "text-amber-500";
      case "warning":
        return "text-orange-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <DashboardShell
      title="Activity & Alerts"
      description="Monitor your account activity and configure alerts"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Inactivity Configuration */}
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Inactivity Detection
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Configure when to notify your nominees about extended inactivity.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-neutral-100 rounded-xl" />
                <div className="h-10 bg-neutral-100 rounded-xl" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Enable Detection</p>
                    <p className="text-sm text-neutral-500">
                      Notify nominees after period of inactivity
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                </div>

                {/* Days Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">Inactivity Period (days)</label>
                  <input
                    type="number"
                    min="20"
                    max="365"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(e.target.value)}
                    disabled={!enabled}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 bg-background"
                    placeholder="e.g. 80"
                  />
                  <p className="text-xs text-neutral-500">Minimum 20 days</p>
                </div>

                {/* Dynamic Stage Preview */}
                {enabled && Number(inactivityDays) >= 20 && (() => {
                  const total = Number(inactivityDays);
                  const stages = Math.floor(total / 20);
                  const interval = Math.floor(total / stages);
                  return (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-border space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Auto-divided stages ({stages} reminders):</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: stages }).map((_, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded-full font-medium ${
                            i === stages - 1
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            Day {interval * (i + 1)}{i === stages - 1 ? ' 🔓 Nominee Access' : ' 📧 Reminder'}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Status Indicator */}
                {config && (
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-neutral-700">
                        Last activity:{" "}
                        {config.last_activity_at
                          ? new Date(config.last_activity_at).toLocaleDateString()
                          : "No activity recorded"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <Button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column - Alerts Feed */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Recent Alerts
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Important notifications about your account
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} unread
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-neutral-100 rounded-xl" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No alerts"
                description="You're all caught up! No alerts to display."
              />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => !alert.is_read && handleMarkAsRead(alert.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${alert.is_read
                      ? "bg-neutral-50 border-neutral-200"
                      : "bg-white border-neutral-300 hover:border-neutral-400"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={getAlertColor(alert.type, alert.is_read)}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${alert.is_read ? "text-neutral-500" : "text-neutral-900"
                            }`}
                        >
                          {alert.title}
                        </p>
                        <p className="text-sm text-neutral-500 mt-0.5 truncate">
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
