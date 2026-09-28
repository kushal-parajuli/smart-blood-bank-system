// src/components/bloodbank/BloodBankGalleryModal.jsx
// Interactive location photo gallery modal for blood banks (Google Business/Maps style).
// Allows public users to inspect real building and facility photos before visiting.

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  ShieldCheck,
  Camera,
  Loader2,
  Phone,
} from "lucide-react";
import { fetchPublicBloodBankImages } from "../../services/bloodBankService";
import { getFullImageUrl } from "../../utils/imageUrl";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const TYPE_LABELS = {
  building: "Building Exterior & Signage",
  gallery: "Facility Interior & Rooms",
  logo: "Official Logo",
  owner: "Facility Contact",
};

export default function BloodBankGalleryModal({ bank, isOpen, onClose }) {
  const [images, setImages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const bankId = bank?.id || bank?.blood_bank_id;

  const loadImages = useCallback(async () => {
    if (!bankId) return;
    setLoading(true);
    try {
      const data = await fetchPublicBloodBankImages(bankId);
      setImages(data.images || []);
      setActiveIndex(0);
    } catch {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    if (isOpen && bankId) {
      loadImages();
    }
  }, [isOpen, bankId, loadImages]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || !bank) return null;

  const activeImage = images[activeIndex] || null;
  const activeUrl = activeImage ? getFullImageUrl(activeImage.image_url) : null;
  const activeLabel =
    activeImage?.caption ||
    `${bank.bank_name} ${TYPE_LABELS[activeImage?.image_type] || "Location Photo"}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${bank.bank_name} Location Gallery`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-6">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-[var(--font-display)] text-base sm:text-lg font-bold text-[var(--foreground)] truncate max-w-[280px] sm:max-w-md">
                {bank.bank_name}
              </h3>
              {!!bank.is_verified_by_admin && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-800/60 bg-emerald-950/60 text-[10px] text-emerald-400 py-0"
                >
                  <ShieldCheck size={11} className="text-emerald-400" />
                  Verified
                </Badge>
              )}
            </div>

            <p className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[var(--primary)]" />
                {bank.city}
                {bank.district ? `, ${bank.district}` : ""}
                {bank.address ? ` · ${bank.address}` : ""}
              </span>
              {bank.phone && (
                <span className="hidden sm:flex items-center gap-1">
                  <Phone size={11} className="text-[var(--primary)]" />
                  {bank.phone}
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--foreground)] hover:bg-[var(--color-surface-elevated)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-72 space-y-3">
              <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
              <p className="text-xs text-[var(--muted-foreground)]">Loading facility photographs...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-subtle)] text-[var(--primary)] border border-[var(--border)]">
                <Building2 size={28} />
              </div>
              <div>
                <h4 className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)]">
                  No physical location photos yet
                </h4>
                <p className="max-w-md text-xs text-[var(--muted-foreground)] mt-1">
                  This blood bank has not uploaded exterior building or interior room photos yet. You can still reach them via contact details or submit an official blood requisition.
                </p>
              </div>
              {bank.phone && (
                <p className="text-xs font-semibold text-[var(--primary)]">
                  Contact: {bank.phone}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* PRIMARY VIEWER */}
              <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border border-[var(--border)]">
                {activeUrl && (
                  <img
                    src={activeUrl}
                    alt={activeLabel}
                    className="max-h-full max-w-full object-contain select-none"
                  />
                )}

                {/* Left / Right Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={() =>
                        setActiveIndex((prev) =>
                          prev > 0 ? prev - 1 : images.length - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer backdrop-blur-xs"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo"
                      onClick={() =>
                        setActiveIndex((prev) =>
                          prev < images.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer backdrop-blur-xs"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Overlaid Classification Badge & Index */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="backdrop-blur-md bg-black/60 border-teal-700/60 text-teal-300 text-xs py-0.5"
                  >
                    {TYPE_LABELS[activeImage?.image_type] || "Facility Photo"}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-mono font-medium text-white">
                    {activeIndex + 1} / {images.length}
                  </span>
                </div>
              </div>

              {/* ACTIVE PHOTO CAPTION */}
              {activeImage?.caption && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--foreground)] text-center font-medium">
                  &quot;{activeImage.caption}&quot;
                </div>
              )}

              {/* THUMBNAILS CAROUSEL */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin pt-1">
                  {images.map((img, idx) => {
                    const thumbUrl = getFullImageUrl(img.image_url);
                    const isCurrent = idx === activeIndex;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveIndex(idx)}
                        aria-label={`Select photo ${idx + 1}`}
                        className={`relative h-16 w-24 sm:h-20 sm:w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/40 scale-102"
                            : "border-[var(--border)] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={thumbUrl}
                          alt={img.caption || `Thumbnail ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-[var(--border)] px-4 py-3 sm:px-6 flex justify-between items-center text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <Camera size={13} className="text-[var(--primary)]" />
            Location Imagery System
          </span>
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
