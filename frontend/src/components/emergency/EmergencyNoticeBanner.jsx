// src/components/emergency/EmergencyNoticeBanner.jsx
// Production-grade global emergency blood notice banner.
// Renders near the top of the application when active notices exist.
// Allows temporary session dismissal via 'X' without database alteration.

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Siren,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Building2,
  Droplet,
} from "lucide-react";
import { getActiveEmergencyNotices } from "../../services/emergencyNoticeService";
import {
  EMERGENCY_LEVEL_CONFIG,
  formatNeededBy,
} from "../../utils/emergencyFormatters";
import EmergencyNoticeDetailModal from "./EmergencyNoticeDetailModal";

export default function EmergencyNoticeBanner() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [selectedNoticeForDetails, setSelectedNoticeForDetails] = useState(null);

  // Poll for active notices gracefully
  const fetchActiveNotices = useCallback(async () => {
    try {
      const data = await getActiveEmergencyNotices();
      const rawNotices = data.notices || [];

      // Filter out any notice whose expiration timestamp has already passed locally
      const now = Date.now();
      const validNotices = rawNotices.filter((n) => {
        const expiry = new Date(n.expires_at).getTime();
        return !isNaN(expiry) && expiry > now;
      });

      setNotices(validNotices);
    } catch {
      // Gracefully fail silently so the application remains completely functional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveNotices();

    // Revalidate every 45 seconds to automatically catch new notices and drop expired ones
    const interval = setInterval(fetchActiveNotices, 45000);
    return () => clearInterval(interval);
  }, [fetchActiveNotices]);

  // Filter out locally dismissed notices for this session
  const visibleNotices = useMemo(() => {
    return notices.filter((n) => !dismissedIds.has(n.id));
  }, [notices, dismissedIds]);

  // Adjust currentIndex if out of bounds after a dismissal
  useEffect(() => {
    if (currentIndex >= visibleNotices.length && visibleNotices.length > 0) {
      setCurrentIndex(visibleNotices.length - 1);
    }
  }, [currentIndex, visibleNotices.length]);

  // Handle temporary session dismissal
  const handleDismissNotice = (noticeId, e) => {
    if (e) e.stopPropagation();
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(noticeId);
      return next;
    });
  };

  // If loading or no visible active notices exist, display NOTHING
  if (loading || visibleNotices.length === 0) {
    return null;
  }

  const activeNotice = visibleNotices[currentIndex] || visibleNotices[0];
  if (!activeNotice) return null;

  const levelCfg =
    EMERGENCY_LEVEL_CONFIG[activeNotice.emergency_level] ||
    EMERGENCY_LEVEL_CONFIG.red;

  const totalCount = visibleNotices.length;
  const neededByText = formatNeededBy(activeNotice.expires_at);

  return (
    <>
      <aside
        role="region"
        aria-label="Emergency Blood Requests"
        className={`w-full transition-colors duration-200 border-b shadow-sm ${
          activeNotice.emergency_level === "red"
            ? "bg-rose-950/85 border-rose-800/80 text-rose-100"
            : activeNotice.emergency_level === "yellow"
            ? "bg-amber-950/85 border-amber-800/80 text-amber-100"
            : "bg-emerald-950/85 border-emerald-800/80 text-emerald-100"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-2">
          
          {/* Main Notice Content Area */}
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-hidden mr-2">
            
            {/* Urgency Badge + Blood Group Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                  activeNotice.emergency_level === "red"
                    ? "bg-rose-600 text-white"
                    : activeNotice.emergency_level === "yellow"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {activeNotice.emergency_level === "red" ? (
                  <Siren size={13} className="shrink-0" />
                ) : activeNotice.emergency_level === "yellow" ? (
                  <AlertTriangle size={13} className="shrink-0" />
                ) : (
                  <Info size={13} className="shrink-0" />
                )}
                {levelCfg.badgeText}
              </span>

              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/30 border border-white/10 text-white">
                <Droplet size={11} className="fill-current text-rose-400" />
                {activeNotice.blood_group} · {activeNotice.quantity_required}{" "}
                {activeNotice.quantity_unit || "units"}
              </span>
            </div>

            {/* Description & Facility Context */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-200">
              <span className="font-semibold text-white truncate max-w-[240px] sm:max-w-[340px]">
                {activeNotice.bank_name ? (
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={12} className="opacity-75 shrink-0" />
                    <span>{activeNotice.bank_name} needs help from another blood bank</span>
                  </span>
                ) : (
                  "Blood bank needs help from another blood bank"
                )}
              </span>

              <span className="text-white/40 hidden sm:inline">•</span>

              <span className="text-white/90 font-medium">
                {neededByText}
              </span>
            </div>

            {/* View Details Action */}
            <button
              onClick={() => setSelectedNoticeForDetails(activeNotice)}
              className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Eye size={13} />
              <span>View details</span>
            </button>
          </div>

          {/* Right Controls: Carousel navigation (if multiple) & Dismiss X */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Multiple Notices Carousel Controls */}
            {totalCount > 1 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/25 text-[11px] font-mono border border-white/10">
                <span className="text-white/80 font-medium mr-1 hidden sm:inline">
                  {currentIndex + 1} of {totalCount}
                </span>

                <button
                  onClick={() =>
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1))
                  }
                  title="Previous emergency notice"
                  className="rounded p-0.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                <button
                  onClick={() =>
                    setCurrentIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0))
                  }
                  title="Next emergency notice"
                  className="rounded p-0.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Session Dismiss Button */}
            <button
              onClick={(e) => handleDismissNotice(activeNotice.id, e)}
              title="Dismiss this notice for this session"
              aria-label="Dismiss notice for this session"
              className="rounded-md p-1 text-white/70 hover:bg-black/30 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Lightweight Notice Detail Modal */}
      <EmergencyNoticeDetailModal
        isOpen={Boolean(selectedNoticeForDetails)}
        notice={selectedNoticeForDetails}
        onClose={() => setSelectedNoticeForDetails(null)}
      />
    </>
  );
}
