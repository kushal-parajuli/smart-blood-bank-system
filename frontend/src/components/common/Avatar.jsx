// src/components/common/Avatar.jsx
// Reusable profile avatar component adhering to the application's healthcare theme:
// 1. If valid profile image exists -> render optimized image.
// 2. If no image or load error -> render the first letter of the user's name as fallback.
// 3. Graceful fallback if name is absent.

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { getFullImageUrl } from "../../utils/imageUrl";

const SIZE_MAP = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-20 w-20 text-2xl",
};

export default function Avatar({
  src,
  name,
  alt,
  size = "md",
  className,
  fallbackClassName,
  title,
}) {
  const [imgError, setImgError] = useState(false);

  // When src changes, reset error state so the new image has a chance to load
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const fullUrl = getFullImageUrl(src);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  // Derive initial from name or alt
  const getInitial = () => {
    const raw = (name || alt || "").trim();
    if (!raw) return "U";
    return raw.charAt(0).toUpperCase();
  };

  const initial = getInitial();
  const label = alt || (name ? `${name}'s profile` : "User profile");

  if (fullUrl && !imgError) {
    return (
      <img
        src={fullUrl}
        alt={label}
        title={title || label}
        onError={() => setImgError(true)}
        className={cn(
          "rounded-full object-cover shrink-0 select-none border border-[var(--border)]",
          sizeClass,
          className
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      title={title || label}
      className={cn(
        "flex items-center justify-center rounded-full font-bold select-none shrink-0 tracking-tight",
        "bg-gradient-to-br from-teal-800/80 via-teal-900 to-slate-900 text-teal-200 border border-teal-700/60 shadow-xs",
        sizeClass,
        fallbackClassName,
        className
      )}
    >
      <span className="leading-none">{initial}</span>
    </div>
  );
}
