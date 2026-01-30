"use client";

import { forwardRef, SelectHTMLAttributes } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, hint, options, placeholder, id, ...props },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "block w-full appearance-none rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-sm text-neutral-900",
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              error
                ? "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/20"
                : "border-neutral-300 focus-visible:border-accent-500 focus-visible:ring-accent-500/20",
              "disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        {(error || hint) && (
          <p
            className={clsx(
              "text-sm",
              error ? "text-error-600" : "text-neutral-500"
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
