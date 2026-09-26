// src/components/ui/card.jsx
// Versatile surface container supporting multiple visual treatments on dark supportive theme.

import { cn } from "../../lib/utils";

const variantStyles = {
  default: "bg-[var(--color-surface)] border border-[var(--color-line-default)] rounded-xl shadow-sm",
  subtle: "bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-line-subtle)]",
  elevated: "bg-[var(--color-surface-elevated)] rounded-xl shadow-lg border border-[var(--color-line-default)]",
  interactive:
    "bg-[var(--color-surface)] rounded-xl border border-[var(--color-line-default)] hover:border-[var(--color-brand)]/50 hover:shadow-md transition-all",
  emergency:
    "bg-[var(--color-urgent-subtle)] border border-[var(--color-urgent-border)] rounded-xl",
  flush: "bg-transparent border-0 rounded-none shadow-none",
};

export function Card({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "text-[var(--color-ink-primary)]",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("font-[var(--font-display)] text-base sm:text-lg font-bold tracking-tight text-[var(--color-ink-primary)]", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs sm:text-sm text-[var(--color-ink-secondary)] leading-relaxed", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 sm:p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-5 sm:p-6 pt-0 border-t border-[var(--color-line-subtle)] mt-4", className)} {...props} />;
}