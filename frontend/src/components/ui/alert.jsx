// src/components/ui/alert.jsx
// Healthcare clinical alerts and message banners.

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../lib/utils";

const variantConfig = {
  destructive: {
    icon: AlertCircle,
    style: "border-[var(--color-urgent-border)] bg-[var(--color-urgent-subtle)] text-[#991b1b]",
    iconStyle: "text-[var(--color-urgent)]",
  },
  warning: {
    icon: AlertTriangle,
    style: "border-[var(--color-caution-border)] bg-[var(--color-caution-subtle)] text-[#92400e]",
    iconStyle: "text-[var(--color-caution)]",
  },
  success: {
    icon: CheckCircle2,
    style: "border-[var(--color-verified-border)] bg-[var(--color-verified-subtle)] text-[#065f46]",
    iconStyle: "text-[var(--color-verified)]",
  },
  info: {
    icon: Info,
    style: "border-[var(--color-info-border)] bg-[var(--color-info-subtle)] text-[#075985]",
    iconStyle: "text-[var(--color-info)]",
  },
  default: {
    icon: Info,
    style: "border-[var(--color-line-default)] bg-slate-50 text-[var(--color-ink-primary)]",
    iconStyle: "text-[var(--color-ink-secondary)]",
  },
};

export function Alert({ className, variant = "destructive", title, children, ...props }) {
  const config = variantConfig[variant] || variantConfig.destructive;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3.5 text-xs sm:text-sm leading-relaxed",
        config.style,
        className
      )}
      {...props}
    >
      <Icon size={18} className={cn("mt-0.5 shrink-0", config.iconStyle)} />
      <div className="space-y-0.5 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}