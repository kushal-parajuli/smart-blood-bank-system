// src/components/ui/badge.jsx
// Semantic clinical status badges with supportive dark theme color hierarchy.

import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)]",
        verified:
          "border-[var(--color-verified-border)] bg-[var(--color-verified-subtle)] text-[var(--color-verified)] font-semibold",
        emergency:
          "border-[var(--color-urgent-border)] bg-[var(--color-urgent-subtle)] text-[var(--color-urgent-hover)] font-bold uppercase tracking-wider",
        urgent:
          "border-[var(--color-caution-border)] bg-[var(--color-caution-subtle)] text-[var(--color-caution)] font-semibold",
        neutral:
          "border-[var(--color-line-default)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-secondary)]",
        outline:
          "border-[var(--color-line-default)] bg-[var(--color-surface)] text-[var(--color-ink-primary)]",
        solid:
          "border-transparent bg-[var(--primary)] text-white font-semibold",
        destructive:
          "border-[var(--color-urgent-border)] bg-[var(--color-urgent-subtle)] text-[var(--color-urgent-hover)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}