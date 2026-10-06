// src/components/emergency/EmergencyNoticeManager.jsx
// Management table and controls for emergency notices.
// Embedded in Blood Bank Dashboard and Admin Dashboard.

import { useState, useEffect, useCallback } from "react";
import {
  Siren,
  Plus,
  RefreshCw,
  Clock,
  Ban,
  CheckCircle2,
  Building2,
  AlertTriangle,
  Info,
  Calendar,
  Droplet,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getEmergencyNotices,
  cancelEmergencyNotice,
} from "../../services/emergencyNoticeService";
import {
  EMERGENCY_LEVEL_CONFIG,
  formatDateTime,
  formatRemainingTime,
} from "../../utils/emergencyFormatters";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Alert } from "../ui/alert";
import EmergencyNoticeFormModal from "./EmergencyNoticeFormModal";
import EmergencyNoticeDetailModal from "./EmergencyNoticeDetailModal";

export default function EmergencyNoticeManager({
  isAdmin = false,
  bloodBanksList = [],
  currentBank = null,
}) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("active"); // 'active' | 'all'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedNoticeForDetails, setSelectedNoticeForDetails] = useState(null);

  // Cancellation state
  const [cancelModalNotice, setCancelModalNotice] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmergencyNotices({ status: filterStatus });
      setNotices(data.notices || []);
    } catch {
      setNotification({
        type: "error",
        message: "Failed to load emergency notices. Please refresh.",
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Handle cancellation execution
  const handleConfirmCancel = async () => {
    if (!cancelModalNotice) return;
    const targetId = cancelModalNotice.id;
    setActionLoadingId(targetId);
    try {
      await cancelEmergencyNotice(targetId);
      setNotification({
        type: "success",
        message: `Emergency notice #${targetId} (${cancelModalNotice.blood_group}) was cancelled and removed from broadcast.`,
      });
      setCancelModalNotice(null);
      loadNotices();
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to cancel emergency notice.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeCount = notices.filter(
    (n) => n.status === "active" && new Date(n.expires_at) > new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <Alert
          variant={notification.type === "error" ? "destructive" : "info"}
          className="flex items-center justify-between"
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </Alert>
      )}

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-lg sm:text-xl font-bold text-[var(--foreground)]">
              Emergency Blood Shortage Notices
            </h2>
            {activeCount > 0 && (
              <Badge variant="solid" className="bg-rose-600 text-white text-[11px] font-bold">
                {activeCount} Broadcasting
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {isAdmin
              ? "Oversee system-wide emergency shortage notices broadcasted across the network."
              : "Broadcast temporary urgent requests to donors and nearby blood banks for required blood."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotices}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus size={15} />
            Create Emergency Notice
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--border)] text-xs font-semibold">
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterStatus === "active"
                ? "bg-rose-600 text-white"
                : "text-[var(--muted-foreground)] hover:text-white"
            }`}
          >
            Active Broadcasts
          </button>
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterStatus === "all"
                ? "bg-slate-700 text-white"
                : "text-[var(--muted-foreground)] hover:text-white"
            }`}
          >
            All History
          </button>
        </div>

        <span className="text-xs text-[var(--muted-foreground)]">
          Showing {notices.length} notice{notices.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Notices List / Table */}
      {notices.length === 0 ? (
        <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-10 text-center">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
          <h3 className="font-heading text-sm font-bold text-[var(--foreground)]">
            {filterStatus === "active"
              ? "No active emergency notices"
              : "No emergency notices found"}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto mt-1">
            {filterStatus === "active"
              ? "There are currently no emergency shortages broadcasting. Click 'Create Emergency Notice' to broadcast an urgent request."
              : "No historical emergency notices have been published yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => {
            const levelCfg =
              EMERGENCY_LEVEL_CONFIG[n.emergency_level] ||
              EMERGENCY_LEVEL_CONFIG.red;

            const isExpired = new Date(n.expires_at) <= new Date();
            const isCancelled = n.status === "cancelled" || Boolean(n.cancelled_at);
            const isActive = !isExpired && !isCancelled;
            const remaining = formatRemainingTime(n.expires_at);

            return (
              <Card
                key={n.id}
                className={`p-4 sm:p-5 transition-all border ${
                  isActive
                    ? n.emergency_level === "red"
                      ? "border-rose-900/60 bg-rose-950/20"
                      : n.emergency_level === "yellow"
                      ? "border-amber-900/60 bg-amber-950/20"
                      : "border-emerald-900/60 bg-emerald-950/20"
                    : "border-[var(--border)] bg-[var(--card)] opacity-85"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Notice core details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${levelCfg.badgeClass}`}>
                        {levelCfg.badgeText}
                      </span>

                      <span className="font-mono text-lg font-black text-[var(--foreground)]">
                        {n.blood_group}
                      </span>

                      <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                        • {n.quantity_required} {n.quantity_unit || "units"} required
                      </span>

                      {/* Status indicator pill */}
                      {isActive ? (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 text-[10px]">
                          ● Active Broadcast ({remaining})
                        </Badge>
                      ) : isCancelled ? (
                        <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-900 text-[10px]">
                          Cancelled manually
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-700 text-slate-500 bg-slate-900 text-[10px]">
                          Expired
                        </Badge>
                      )}
                    </div>

                    {/* Facility info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      {(isAdmin || n.bank_name) && (
                        <span className="flex items-center gap-1 text-[var(--foreground)] font-medium">
                          <Building2 size={13} className="text-[var(--primary)]" />
                          {n.bank_name || "Central Blood System"}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        Published: {formatDateTime(n.published_at || n.created_at)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-amber-400" />
                        Expires: {formatDateTime(n.expires_at)}
                      </span>
                    </div>

                    {/* Message snippet */}
                    {n.message && (
                      <p className="text-xs text-[var(--foreground)] bg-[var(--color-surface-subtle)] p-2.5 rounded-lg border border-[var(--border)] max-w-2xl line-clamp-2">
                        &quot;{n.message}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t border-[var(--border)] pt-3 md:border-t-0 md:pt-0 self-start md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedNoticeForDetails(n)}
                      className="gap-1 text-xs"
                    >
                      <Eye size={13} />
                      Details
                    </Button>

                    {isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoadingId === n.id}
                        onClick={() => setCancelModalNotice(n)}
                        className="gap-1 text-xs font-semibold shadow-xs"
                      >
                        <Ban size={13} />
                        Cancel Notice
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <EmergencyNoticeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setNotification({
            type: "success",
            message: "Emergency notice successfully published and broadcasting.",
          });
          loadNotices();
        }}
        isAdmin={isAdmin}
        bloodBanksList={bloodBanksList}
        currentBank={currentBank}
      />

      {/* Details Modal */}
      <EmergencyNoticeDetailModal
        isOpen={Boolean(selectedNoticeForDetails)}
        notice={selectedNoticeForDetails}
        onClose={() => setSelectedNoticeForDetails(null)}
      />

      {/* Cancellation Confirmation Dialog */}
      {cancelModalNotice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--color-surface)] p-6 text-[var(--foreground)] shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-950 text-rose-400 border border-rose-800">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-[var(--foreground)]">
                  Cancel this emergency notice?
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Once cancelled, this notice will immediately stop appearing in the top banner to all users across the platform.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-[var(--color-surface-subtle)] p-3 border border-[var(--border)] text-xs text-[var(--foreground)] space-y-1">
              <p>
                <strong>Blood Group:</strong> {cancelModalNotice.blood_group} (
                {cancelModalNotice.quantity_required}{" "}
                {cancelModalNotice.quantity_unit || "units"})
              </p>
              <p>
                <strong>Urgency:</strong>{" "}
                <span className="capitalize">{cancelModalNotice.emergency_level}</span>
              </p>
              <p>
                <strong>Expires:</strong> {formatDateTime(cancelModalNotice.expires_at)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalNotice(null)}
                disabled={actionLoadingId === cancelModalNotice.id}
              >
                Keep Active
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={actionLoadingId === cancelModalNotice.id}
                className="gap-1.5 font-semibold"
              >
                {actionLoadingId === cancelModalNotice.id ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  <>
                    <Ban size={13} />
                    Confirm Cancellation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
