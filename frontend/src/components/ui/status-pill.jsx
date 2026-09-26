// src/components/ui/status-pill.jsx
// Standardized semantic status indicators for requisitions, appointments, and facilities.

import {
  Clock,
  CheckCircle2,
  XCircle,
  Siren,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../lib/utils";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "border-teal-200 bg-teal-50 text-teal-800",
  },
  fulfilled: {
    label: "Fulfilled",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "border-slate-200 bg-slate-50 text-slate-500",
  },
  emergency: {
    label: "Emergency",
    icon: Siren,
    className: "border-rose-200 bg-rose-50 text-rose-700 font-bold",
  },
  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-800 font-semibold",
  },
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold",
  },
};

export function StatusPill({ status, label, className, icon: showIcon = true }) {
  const normalized = (status || "").toLowerCase();
  const config = STATUS_CONFIG[normalized] || {
    label: status || "Unknown",
    icon: Clock,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };

  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] select-none",
        config.className,
        className
      )}
    >
      {showIcon && <Icon size={12} className="shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  );
}
