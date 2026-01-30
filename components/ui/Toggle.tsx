"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/Switch";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

// Legacy wrapper for backward compatibility
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 cursor-pointer",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}
    </label>
  );
}
