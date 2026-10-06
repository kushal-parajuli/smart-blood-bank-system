// src/utils/emergencyFormatters.js
// Formatting helpers for emergency blood notices.

export const EMERGENCY_LEVEL_CONFIG = {
  red: {
    level: "red",
    label: "Urgent",
    badgeText: "URGENT",
    bgClass: "bg-rose-950/80",
    borderClass: "border-rose-700/70",
    textClass: "text-rose-200",
    badgeClass: "bg-rose-600 text-white font-bold tracking-wider",
    dotClass: "bg-rose-500",
    accentClass: "text-rose-400",
  },
  yellow: {
    level: "yellow",
    label: "Less Urgent",
    badgeText: "LESS URGENT",
    bgClass: "bg-amber-950/80",
    borderClass: "border-amber-700/70",
    textClass: "text-amber-200",
    badgeClass: "bg-amber-500 text-slate-950 font-bold tracking-wider",
    dotClass: "bg-amber-400",
    accentClass: "text-amber-400",
  },
  green: {
    level: "green",
    label: "Least Urgent",
    badgeText: "LEAST URGENT",
    bgClass: "bg-emerald-950/80",
    borderClass: "border-emerald-700/70",
    textClass: "text-emerald-200",
    badgeClass: "bg-emerald-600 text-white font-bold tracking-wider",
    dotClass: "bg-emerald-400",
    accentClass: "text-emerald-400",
  },
};

/**
 * Returns human-readable needed-by string.
 * Example: "Needed by 6:00 PM", "Needed by tomorrow, 11:30 AM", or "Needed by Oct 12, 4:00 PM".
 */
export function formatNeededBy(dateInput) {
  if (!dateInput) return "Time not specified";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid date";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (isToday) {
    return `Needed by ${timeStr} today`;
  }
  if (isTomorrow) {
    return `Needed by tomorrow, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `Needed by ${dateStr}, ${timeStr}`;
}

/**
 * Returns time remaining until expiration.
 */
export function formatRemainingTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return "Expired";

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return `${diffDays}d ${remHours}h remaining`;
  }
  if (diffHours > 0) {
    const remMins = diffMins % 60;
    return `${diffHours}h ${remMins}m remaining`;
  }
  return `${diffMins} min${diffMins === 1 ? "" : "s"} remaining`;
}

/**
 * Formats full date and time for detail views.
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
