// src/components/emergency/EmergencyNoticeFormModal.jsx
// Accessible, rapid-entry form modal for creating emergency blood notices.
// Used by Blood Bank and Administrator dashboards.

import { useState } from "react";
import {
  X,
  Siren,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Droplet,
  Building2,
  Loader2,
  Check,
} from "lucide-react";
import { createEmergencyNotice } from "../../services/emergencyNoticeService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert } from "../ui/alert";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMERGENCY_LEVELS = [
  {
    id: "red",
    label: "Red — Urgent",
    desc: "Critical shortage / immediate lifesaving need",
    badgeClass: "bg-rose-600 text-white",
    borderActive: "border-rose-500 bg-rose-950/40 text-rose-200",
    icon: Siren,
  },
  {
    id: "yellow",
    label: "Yellow — Less Urgent",
    desc: "Impending stock deficit / scheduled surgery buffer",
    badgeClass: "bg-amber-500 text-slate-950",
    borderActive: "border-amber-500 bg-amber-950/40 text-amber-200",
    icon: AlertTriangle,
  },
  {
    id: "green",
    label: "Green — Least Urgent",
    desc: "Routine replenishment / donor callout",
    badgeClass: "bg-emerald-600 text-white",
    borderActive: "border-emerald-500 bg-emerald-950/40 text-emerald-200",
    icon: Info,
  },
];

export default function EmergencyNoticeFormModal({
  isOpen,
  onClose,
  onSuccess,
  isAdmin = false,
  bloodBanksList = [],
  currentBank = null,
}) {
  const [bloodGroup, setBloodGroup] = useState("");
  const [quantityRequired, setQuantityRequired] = useState("4");
  const [quantityUnit, setQuantityUnit] = useState("units");
  const [emergencyLevel, setEmergencyLevel] = useState("red");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Preset time buttons (+4h, +12h, +24h, +48h)
  const applyPresetHours = (hours) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    // Format to YYYY-MM-DDTHH:MM for datetime-local
    const pad = (n) => String(n).padStart(2, "0");
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setExpiresAt(localIso);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!bloodGroup) {
      setError("Please select a required blood group.");
      return;
    }

    const qty = parseInt(quantityRequired, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive quantity of units.");
      return;
    }

    if (!expiresAt) {
      setError("Please select an expiration date and time.");
      return;
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      setError("Expiration date and time must be set in the future.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        bloodGroup,
        quantityRequired: qty,
        quantityUnit: quantityUnit || "units",
        emergencyLevel,
        expiresAt: expiryDate.toISOString(),
        message: message.trim() || undefined,
      };

      if (isAdmin && selectedBankId) {
        payload.bloodBankId = Number(selectedBankId);
      }

      await createEmergencyNotice(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to publish emergency notice. Please check all fields and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Min datetime-local value (now)
  const minDateTime = (() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--color-surface)] text-[var(--foreground)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div
          className={`h-2 w-full transition-colors ${
            emergencyLevel === "red"
              ? "bg-rose-600"
              : emergencyLevel === "yellow"
              ? "bg-amber-500"
              : "bg-emerald-600"
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/30">
              <Siren size={20} />
            </div>
            <div>
              <h2
                id="create-notice-title"
                className="font-heading text-lg font-bold text-[var(--foreground)]"
              >
                Create Emergency Blood Notice
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Broadcast when your blood bank has insufficient or depleted stock and needs help from other blood banks or donors.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close form"
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-surface-subtle)] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && <Alert variant="destructive">{error}</Alert>}

          {/* Admin facility selection (optional) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                <Building2 size={13} />
                Facility Affiliation (Optional)
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              >
                <option value="">System-Wide / No specific facility</option>
                {bloodBanksList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name} ({b.city || b.district || "Facility"})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Leave blank to issue on behalf of the central blood governance authority.
              </p>
            </div>
          )}

          {/* Blood Bank display when bank user */}
          {!isAdmin && currentBank && (
            <div className="rounded-lg bg-[var(--color-surface-subtle)] p-3 border border-[var(--border)] flex items-center gap-2.5 text-xs text-[var(--muted-foreground)]">
              <Building2 size={16} className="text-[var(--primary)] shrink-0" />
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  Publishing as: {currentBank.bank_name}
                </p>
                <p className="text-[11px]">
                  {currentBank.city}, {currentBank.district} • License: {currentBank.license_number}
                </p>
              </div>
            </div>
          )}

          {/* Emergency Urgency Level */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Emergency Urgency Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {EMERGENCY_LEVELS.map((lvl) => {
                const IconComponent = lvl.icon;
                const isSelected = emergencyLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setEmergencyLevel(lvl.id)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? lvl.borderActive + " shadow-sm ring-1 ring-current"
                        : "border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)] hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${lvl.badgeClass}`}>
                        <IconComponent size={12} />
                        {lvl.id.toUpperCase()}
                      </span>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-semibold text-[var(--foreground)] mt-1">
                      {lvl.label.split("—")[1]?.trim()}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5 leading-tight">
                      {lvl.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blood Group and Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Blood Group Required <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 text-center rounded-lg font-mono text-sm font-black transition-all cursor-pointer ${
                      bloodGroup === bg
                        ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-400/50"
                        : "bg-[var(--color-surface-subtle)] border border-[var(--border)] text-[var(--foreground)] hover:border-slate-500"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Quantity (Units) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="500"
                required
                placeholder="e.g. 4"
                value={quantityRequired}
                onChange={(e) => setQuantityRequired(e.target.value)}
                className="font-mono text-base bg-[var(--color-surface-subtle)]"
              />
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Number of donor units needed for the emergency procedure.
              </p>
            </div>
          </div>

          {/* Expiration Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                <Clock size={13} />
                Expiration Date &amp; Time <span className="text-rose-500">*</span>
              </label>
              {/* Quick preset buttons */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-[var(--muted-foreground)] mr-1 hidden sm:inline">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => applyPresetHours(4)}
                  className="px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--border)] text-xs hover:border-[var(--primary)] transition-colors cursor-pointer"
                >
                  +4h
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetHours(12)}
                  className="px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--border)] text-xs hover:border-[var(--primary)] transition-colors cursor-pointer"
                >
                  +12h
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetHours(24)}
                  className="px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--border)] text-xs hover:border-[var(--primary)] transition-colors cursor-pointer"
                >
                  +24h
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetHours(48)}
                  className="px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--border)] text-xs hover:border-[var(--primary)] transition-colors cursor-pointer"
                >
                  +48h
                </button>
              </div>
            </div>

            <Input
              type="datetime-local"
              required
              min={minDateTime}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="bg-[var(--color-surface-subtle)] font-mono text-sm"
            />
            <p className="text-[11px] text-[var(--muted-foreground)]">
              The notice will automatically stop appearing across the application once this expiration time is reached.
            </p>
          </div>

          {/* Optional Message / Clinical Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Notice Context / Clinical Details (Optional)
              </label>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {message.length}/1000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              placeholder="e.g. We urgently need 5 units of O+. If another blood bank has available stock, please contact us."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex w-full rounded-lg border border-[var(--input)] bg-[var(--color-surface-subtle)] p-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--muted-foreground)] resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Publishing Notice…
                </>
              ) : (
                <>
                  <Siren size={15} />
                  Publish Emergency Notice
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
