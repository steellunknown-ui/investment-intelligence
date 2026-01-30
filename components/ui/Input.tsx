"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    // If we have label/error/hint props, use the wrapped version
    if (label || error || hint) {
      return (
        <div className="space-y-1.5">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-foreground"
            >
              {label}
            </label>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-destructive focus-visible:ring-destructive/20"
                : "border-input focus-visible:ring-ring/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {(error || hint) && (
            <p
              className={cn(
                "text-sm",
                error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {error || hint}
            </p>
          )}
        </div>
      );
    }

    // Standard shadcn input
    return (
      <input
        type={type}
        id={inputId}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
