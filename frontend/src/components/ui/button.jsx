// src/components/ui/button.jsx
// Healthcare product button component with accessible focus ring and supportive dark theme tokens.

import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] font-semibold",
        secondary:
          "bg-[var(--color-surface-subtle)] text-[var(--color-ink-primary)] hover:bg-[var(--color-line-default)] border border-[var(--color-line-default)]",
        outline:
          "border border-[var(--color-line-default)] bg-[var(--color-surface)] text-[var(--color-ink-primary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]/40",
        ghost:
          "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-subtle)]",
        destructive:
          "bg-[var(--color-urgent)] text-white shadow-xs hover:bg-[var(--color-urgent-hover)] active:bg-[var(--color-urgent-hover)] font-semibold",
        link:
          "text-[var(--color-brand)] underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 text-xs font-medium",
        lg: "h-11 px-6 text-base font-semibold",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}