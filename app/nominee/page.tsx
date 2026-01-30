"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatUpdatedAt } from "@/lib/dateUtils";
import { UserPlus, Info, Trash2, Mail, Users, CheckCircle, Clock } from "lucide-react";
import { RELATIONSHIP_OPTIONS, ACCESS_LEVELS } from "@/lib/constants";
import type { Nominee } from "@/lib/types";

export default function NomineePage() {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [accessLevel, setAccessLevel] = useState("view_only");

  const fetchNominees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/nominees");
      if (!res.ok) throw new Error("Failed to fetch nominees");
      const data = await res.json();
      setNominees(data.nominees || []);
    } catch (err) {
      console.error("Fetch nominees error:", err);
      setError("Failed to load nominees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNominees();
  }, [fetchNominees]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRelationship("");
    setAccessLevel("view_only");
    setError(null);
  };

  const handleAddNominee = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/nominees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          relationship: relationship || null,
          access_level: accessLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add nominee");
      }

      setIsModalOpen(false);
      fetchNominees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add nominee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (nomineeId: string) => {
    try {
      const res = await fetch(`/api/nominees/${nomineeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete nominee");
      }

      fetchNominees();
    } catch (err) {
      console.error("Delete nominee error:", err);
    }
  };

  const accessLevelLabels: Record<string, string> = {
    view_only: "View Only",
    limited: "Limited Access",
  };

  return (
    <DashboardShell
      title="Nominee Management"
      description="Manage trusted contacts for your portfolio"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">About Nominees</p>
              <p className="mt-1">
                Nominees are trusted contacts who can receive read-only access to
                your portfolio information in case of extended inactivity. This
                helps ensure your investments are monitored even when you can&apos;t.
              </p>
            </div>
          </div>
        </Card>

        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Your Nominees
            </h2>
            <p className="text-sm text-neutral-500">
              {nominees.length} of 3 nominees added
            </p>
          </div>
          {nominees.length < 3 && (
            <Button onClick={handleAddNominee}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Nominee
            </Button>
          )}
        </div>

        {/* Nominee List */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : nominees.length === 0 ? (
          <Card>
            <div className="py-8">
              <EmptyState
                icon={Users}
                title="No nominees yet"
                description="Add trusted contacts who can monitor your portfolio during extended inactivity."
                action={{
                  label: "Add Your First Nominee",
                  onClick: handleAddNominee,
                }}
              />
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nominees.map((nominee) => (
              <Card key={nominee.id} className="relative">
                <div className="space-y-3">
                  {/* Header with Name & Delete */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {nominee.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-0.5">
                        <Mail className="h-3.5 w-3.5" />
                        {nominee.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(nominee.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
                      title="Remove nominee"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Relationship */}
                  {nominee.relationship && (
                    <p className="text-sm text-neutral-600">
                      {RELATIONSHIP_OPTIONS.find(r => r.value === nominee.relationship)?.label || nominee.relationship}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">
                      {accessLevelLabels[nominee.access_level] || nominee.access_level}
                    </Badge>
                    <Badge variant={nominee.is_verified ? "success" : "warning"}>
                      {nominee.is_verified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-muted-foreground pt-2 border-t border-slate-100">
                    {formatUpdatedAt(nominee.updated_at || nominee.created_at)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Nominee Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Nominee</DialogTitle>
            <DialogDescription>
              Add a trusted contact who can access your portfolio during inactivity.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Select
              label="Relationship"
              options={RELATIONSHIP_OPTIONS.map((r) => ({
                value: r.value,
                label: r.label,
              }))}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Select relationship (optional)"
            />
            <Select
              label="Access Level"
              options={ACCESS_LEVELS.map((a) => ({
                value: a.value,
                label: a.label,
              }))}
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Nominee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
