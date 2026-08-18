    // src/components/ui/input.jsx

import { cn } from "../../lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[var(--input)] bg-white px-3.5 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors outline-none",
        "focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export { Input };