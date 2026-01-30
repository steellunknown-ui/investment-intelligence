"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Mail, Trash2, Edit2, CheckCircle, Clock } from "lucide-react";
import type { Nominee } from "@/lib/types";

interface NomineeListProps {
  nominees: Nominee[];
  loading?: boolean;
  onAddNominee?: () => void;
  onEditNominee?: (id: string) => void;
  onDeleteNominee?: (id: string) => void;
}

const accessLevelLabels: Record<string, string> = {
  view_only: "View Only",
  limited: "Limited Access",
};

export function NomineeList({
  nominees,
  loading = false,
  onAddNominee,
  onEditNominee,
  onDeleteNominee,
}: NomineeListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-xl border border-neutral-200 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-neutral-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-200 rounded" />
                <div className="h-3 w-48 bg-neutral-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nominees.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="No nominees added"
          description="Add trusted contacts who can view your portfolio in case of extended inactivity."
          action={{
            label: "Add Nominee",
            onClick: onAddNominee || (() => { }),
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {nominees.map((nominee) => (
        <Card
          key={nominee.id}
          className="hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-medium">
                {nominee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              {/* Details */}
              <div>
                <h4 className="font-medium text-neutral-900">{nominee.name}</h4>
                <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                  <Mail className="h-3.5 w-3.5" />
                  {nominee.email}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {nominee.relationship && (
                    <Badge variant="default">{nominee.relationship}</Badge>
                  )}
                  <Badge variant="info">
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
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditNominee?.(nominee.id)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteNominee?.(nominee.id)}
                className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
