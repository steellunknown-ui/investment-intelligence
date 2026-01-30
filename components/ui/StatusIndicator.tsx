import { clsx } from "clsx";

interface StatusIndicatorProps {
  status:
    | "active"
    | "warning"
    | "triggered"
    | "pending"
    | "verified"
    | "expired"
    | "inactive";
  label?: string;
  showDot?: boolean;
}

export function StatusIndicator({
  status,
  label,
  showDot = true,
}: StatusIndicatorProps) {
  const statusConfig = {
    active: {
      color: "bg-success-500",
      text: "text-success-700",
      label: "Active",
    },
    warning: {
      color: "bg-warning-500",
      text: "text-warning-700",
      label: "Warning",
    },
    triggered: {
      color: "bg-error-500",
      text: "text-error-700",
      label: "Triggered",
    },
    pending: {
      color: "bg-warning-500",
      text: "text-warning-700",
      label: "Pending",
    },
    verified: {
      color: "bg-success-500",
      text: "text-success-700",
      label: "Verified",
    },
    expired: {
      color: "bg-neutral-400",
      text: "text-neutral-600",
      label: "Expired",
    },
    inactive: {
      color: "bg-neutral-400",
      text: "text-neutral-600",
      label: "Inactive",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="inline-flex items-center gap-2">
      {showDot && (
        <span className={clsx("h-2 w-2 rounded-full", config.color)} />
      )}
      <span className={clsx("text-sm font-medium", config.text)}>
        {label || config.label}
      </span>
    </div>
  );
}
