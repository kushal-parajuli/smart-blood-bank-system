// src/components/ui/alert.jsx

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

function Alert({ className, variant = "destructive", children, ...props }) {
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;
  const styles =
    variant === "success"
      ? "border-[var(--primary)]/20 bg-[var(--secondary)] text-[var(--secondary-foreground)]"
      : "border-[var(--destructive)]/20 bg-[var(--destructive)]/10 text-[var(--destructive)]";

  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm", styles, className)} {...props}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export { Alert };