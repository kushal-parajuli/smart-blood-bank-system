// src/components/emergency/EmergencyNoticeDetailModal.jsx
// Lightweight detail modal for emergency blood notices.

import { Link } from "react-router-dom";
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Droplet,
  Search,
  AlertTriangle,
  Siren,
  Info,
  Calendar,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  EMERGENCY_LEVEL_CONFIG,
  formatDateTime,
  formatNeededBy,
  formatRemainingTime,
} from "../../utils/emergencyFormatters";

export default function EmergencyNoticeDetailModal({ isOpen, notice, onClose }) {
  if (!isOpen || !notice) return null;

  const levelCfg =
    EMERGENCY_LEVEL_CONFIG[notice.emergency_level] || EMERGENCY_LEVEL_CONFIG.red;

  const remaining = formatRemainingTime(notice.expires_at);
  const neededBy = formatNeededBy(notice.expires_at);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--color-surface)] text-[var(--foreground)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Urgent header accent bar */}
        <div
          className={`h-2.5 w-full ${
            notice.emergency_level === "red"
              ? "bg-rose-600"
              : notice.emergency_level === "yellow"
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                notice.emergency_level === "red"
                  ? "bg-rose-600 shadow-rose-900/40"
                  : notice.emergency_level === "yellow"
                  ? "bg-amber-500 text-slate-950 shadow-amber-900/40"
                  : "bg-emerald-600 shadow-emerald-900/40"
              }`}
            >
              {notice.emergency_level === "red" ? (
                <Siren size={22} />
              ) : notice.emergency_level === "yellow" ? (
                <AlertTriangle size={22} />
              ) : (
                <Info size={22} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge className={levelCfg.badgeClass}>
                  {levelCfg.badgeText}
                </Badge>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {remaining}
                </span>
              </div>
              <h2
                id="emergency-notice-title"
                className="font-heading text-xl font-extrabold text-[var(--foreground)] mt-1"
              >
                {notice.blood_group} Blood Required ({notice.quantity_required}{" "}
                {notice.quantity_unit || "units"})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-surface-subtle)] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Key requirement banner */}
          <div className="rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Droplet size={20} className="fill-rose-500 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                  Required Blood Group
                </p>
                <p className="font-mono text-xl font-black text-rose-400">
                  {notice.blood_group} · {notice.quantity_required}{" "}
                  {notice.quantity_unit || "units"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">
                Urgency
              </p>
              <p
                className={`text-sm font-bold capitalize ${
                  notice.emergency_level === "red"
                    ? "text-rose-400"
                    : notice.emergency_level === "yellow"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {levelCfg.label}
              </p>
            </div>
          </div>

          {/* Publisher Message / Notes */}
          {notice.message ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Notice Message &amp; Clinical Context
              </h3>
              <p className="rounded-xl bg-[var(--color-surface-subtle)] p-3.5 text-sm text-[var(--foreground)] border border-[var(--border)] leading-relaxed whitespace-pre-wrap">
                {notice.message}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3.5 text-xs text-[var(--muted-foreground)] italic border border-[var(--border)]">
              No additional notes provided by publisher. The publishing blood bank has insufficient stock of this blood group and urgently requests assistance from other blood banks or voluntary donors.
            </div>
          )}

          {/* Blood Bank / Facility Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Publishing Facility
            </h3>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)] p-4 space-y-2.5 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                <Building2 size={16} className="text-[var(--primary)]" />
                <span>{notice.bank_name || "Emergency Blood System Broadcast"}</span>
              </div>

              {(notice.bank_address || notice.bank_city || notice.bank_district) && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-[var(--muted-foreground)] shrink-0 mt-0.5" />
                  <span>
                    {[notice.bank_address, notice.bank_city, notice.bank_district, notice.bank_province]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}

              {notice.bank_phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[var(--muted-foreground)] shrink-0" />
                  <a
                    href={`tel:${notice.bank_phone}`}
                    className="text-[var(--primary)] font-semibold hover:underline"
                  >
                    {notice.bank_phone}
                  </a>
                </div>
              )}

              {notice.bank_email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-[var(--muted-foreground)] shrink-0" />
                  <span>{notice.bank_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--border)]">
              <Calendar size={14} className="text-[var(--primary)]" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">
                  Published
                </p>
                <p className="text-[var(--foreground)] font-medium">
                  {formatDateTime(notice.published_at || notice.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--border)]">
              <Clock size={14} className="text-amber-400" />
              <div>
                <p className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)]">
                  Expires / Needed By
                </p>
                <p className="text-[var(--foreground)] font-medium">
                  {formatDateTime(notice.expires_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-5 sm:p-6 border-t border-[var(--border)] bg-[var(--color-surface-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              asChild
              size="sm"
              className="w-full sm:w-auto gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
            >
              <Link
                to={`/search?blood_group=${encodeURIComponent(notice.blood_group)}`}
                onClick={onClose}
              >
                <Search size={14} /> Search Stock
              </Link>
            </Button>

            {notice.bank_phone && (
              <Button
                asChild
                size="sm"
                variant="destructive"
                className="w-full sm:w-auto gap-1.5 font-semibold"
              >
                <a href={`tel:${notice.bank_phone}`}>
                  <Phone size={14} /> Call Facility
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
