// src/components/ui/input.jsx
// Healthcare form input with accessible focus ring and supportive dark theme tokens.

import { cn } from "../../lib/utils";

export function Input({ className, type = "text", hasError, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border bg-[var(--color-surface-subtle)] px-3.5 py-2 text-sm text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-tertiary)] outline-none transition-all",
        hasError
          ? "border-[var(--color-urgent)] focus:border-[var(--color-urgent)] focus:ring-3 focus:ring-[var(--color-urgent)]/20"
          : "border-[var(--color-line-default)] hover:border-[var(--color-line-strong)] focus:border-[var(--color-brand)] focus:ring-3 focus:ring-[var(--color-brand)]/20",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  );
}