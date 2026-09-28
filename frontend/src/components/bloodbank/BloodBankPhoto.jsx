// src/components/bloodbank/BloodBankPhoto.jsx
// Healthcare facility location photo card/thumbnail component.
// Gracefully renders nothing if no photo exists or if loading errors out,
// preventing layout disruption and avoiding fake/stock placeholders.
// Always clickable — opens external gallery modal if provided, or built-in full lightbox.

import { useState } from "react";
import { Camera, Image as ImageIcon, Maximize2, X } from "lucide-react";
import { getFullImageUrl } from "../../utils/imageUrl";

export default function BloodBankPhoto({
  src,
  bankName = "Blood Bank",
  className = "",
  aspectClass = "aspect-4/3 sm:aspect-square",
  onViewGallery,
  hasGallery = false,
}) {
  const [hasError, setHasError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // If no image is provided or loading failed, render nothing so card layout adapts naturally
  if (!src || hasError) {
    return null;
  }

  const fullUrl = getFullImageUrl(src);
  const altText = `${bankName} facility and building photo`;

  function handleClick(e) {
    e.stopPropagation();
    if (onViewGallery) {
      onViewGallery(e);
    } else {
      setLightboxOpen(true);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative overflow-hidden rounded-xl bg-slate-900 border border-[var(--border)] shrink-0 group cursor-pointer transition-all hover:border-[var(--primary)]/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${aspectClass} ${className}`}
        title={`Click to view full photo of ${bankName}`}
      >
        <img
          src={fullUrl}
          alt={altText}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Dynamic Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
          <span className="text-[10px] font-semibold text-white flex items-center gap-1 drop-shadow-md">
            {onViewGallery ? <Camera size={12} /> : <Maximize2 size={12} />}
            <span>{onViewGallery ? "View Gallery" : "View Photo"}</span>
          </span>
        </div>

        {hasGallery && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 pointer-events-none">
            <ImageIcon size={10} />
            <span>Photos</span>
          </div>
        )}
      </div>

      {/* Built-in Lightbox fallback modal when clicked without an external gallery handler */}
      {lightboxOpen && !onViewGallery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-[var(--primary)]" />
                <h4 className="text-sm font-semibold text-white">{bankName}</h4>
              </div>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-2 sm:p-4 flex items-center justify-center bg-black/40">
              <img
                src={fullUrl}
                alt={altText}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
