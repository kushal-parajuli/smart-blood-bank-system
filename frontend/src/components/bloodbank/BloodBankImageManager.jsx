// src/components/bloodbank/BloodBankImageManager.jsx
// Healthcare facility photo management console for blood banks.
// Enables banks to upload, categorize, view, and delete location and facility imagery.

import { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Trash2,
  Building2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Layers,
  Eye,
  X,
} from "lucide-react";
import {
  uploadBloodBankImage,
  deleteBloodBankImage,
} from "../../services/bloodBankService";
import { getFullImageUrl } from "../../utils/imageUrl";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

const CATEGORIES = [
  {
    type: "building",
    label: "Building Exterior & Signage",
    desc: "Primary location photo to help patients identify your center from the street.",
    icon: Building2,
    badgeColor: "border-teal-700/60 bg-teal-950/60 text-teal-300",
  },
  {
    type: "gallery",
    label: "Facility Interior & Rooms",
    desc: "Donation hall, reception counter, waiting room, or consultation desk.",
    icon: Layers,
    badgeColor: "border-blue-700/60 bg-blue-950/60 text-blue-300",
  },
  {
    type: "logo",
    label: "Official Organization Logo",
    desc: "Symbol or institutional crest representing your blood bank.",
    icon: Shield,
    badgeColor: "border-purple-700/60 bg-purple-950/60 text-purple-300",
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function BloodBankImageManager({
  images = [],
  onImagesChange,
  bankName,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageType, setImageType] = useState("building");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;

    setError("");
    setSuccess("");

    const validNewFiles = [];
    const rejectedErrors = [];

    for (const file of rawFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejectedErrors.push(`"${file.name}" is not a JPEG, PNG, or WebP.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejectedErrors.push(`"${file.name}" exceeds 5MB limit.`);
        continue;
      }

      validNewFiles.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      });
    }

    if (rejectedErrors.length) {
      setError(rejectedErrors.join(" "));
    }

    if (validNewFiles.length) {
      setSelectedFiles((prev) => [...prev, ...validNewFiles]);
    }

    // Reset input so re-selecting same files works if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeSelectedFile(idToRemove) {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  }

  function clearAllSelectedFiles() {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFiles.length) {
      setError("Please select at least one image file first.");
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const data = await uploadBloodBankImage({
        files: selectedFiles.map((item) => item.file),
        imageType,
        caption: caption.trim() || undefined,
      });

      const count = selectedFiles.length;
      setSuccess(`${count} location photo${count > 1 ? "s" : ""} uploaded successfully.`);
      clearAllSelectedFiles();
      setCaption("");
      if (onImagesChange) {
        onImagesChange(data.images || []);
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to upload facility photos. Please verify your connection."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId) {
    setError("");
    setSuccess("");
    setDeletingId(imageId);

    try {
      const data = await deleteBloodBankImage(imageId);
      setSuccess("Photo deleted from facility gallery.");
      setConfirmDeleteId(null);
      if (onImagesChange) {
        onImagesChange(data.images || []);
      }
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete photo. Please check permissions."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const buildingPhotos = images.filter((img) => img.image_type === "building");
  const galleryPhotos = images.filter(
    (img) => img.image_type === "gallery" || img.image_type === "owner"
  );
  const logoPhotos = images.filter((img) => img.image_type === "logo");

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
            Facility &amp; Location Photos
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Upload clear photographs of your facility to help donors and emergency blood seekers recognize your location.
          </p>
        </div>
        <Badge variant="outline" className="font-[var(--font-mono)] self-start sm:self-center">
          {images.length} {images.length === 1 ? "Photo" : "Photos"} Uploaded
        </Badge>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-xs text-emerald-400">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* UPLOAD FORM CARD */}
      <Card className="border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-5">
          <div className="border-b border-[var(--border)] pb-3">
            <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Camera size={16} className="text-[var(--primary)]" />
              Upload New Facility Photo
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Choose the category that best represents what this photo shows.
            </p>
          </div>

          {/* Category Selection Tabs */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--foreground)]">
              Photo Classification <span className="text-[var(--destructive)]">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = imageType === cat.type;
                return (
                  <button
                    key={cat.type}
                    type="button"
                    onClick={() => setImageType(cat.type)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--color-brand-subtle)] text-[var(--foreground)] ring-1 ring-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--foreground)]">
                      <Icon
                        size={15}
                        className={isSelected ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}
                      />
                      <span>{cat.label}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-tight text-[var(--muted-foreground)]">
                      {cat.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Picker & Preview Area */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-start">
            <div className="sm:col-span-7 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                  Image Files (JPEG, PNG, WebP · Max 5MB each · Select Multiple at Once)
                </label>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="blood-bank-photo-input"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/60 rounded-xl bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-elevated)] transition cursor-pointer text-center"
                >
                  <Upload size={22} className="text-[var(--primary)] mb-2" />
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} photo${selectedFiles.length > 1 ? "s" : ""} chosen — Click to add more`
                      : "Click to select one or multiple photographs"}
                  </p>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                    Select multiple facility photos at once from your folder
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                  Batch Caption or Location Note <span className="font-normal text-[var(--muted-foreground)]">(Optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Main entrance facing Ring Road, 2nd floor donation suite"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={120}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Preview Box for Multiple Selected Files */}
            <div className="sm:col-span-5 flex flex-col justify-start min-h-[170px] max-h-[260px] border border-[var(--border)] bg-[var(--color-surface-subtle)] rounded-xl p-3 relative overflow-hidden">
              {selectedFiles.length > 0 ? (
                <div className="w-full flex flex-col h-full">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
                    <span className="text-[11px] font-semibold text-[var(--foreground)]">
                      {selectedFiles.length} {selectedFiles.length === 1 ? "Photo" : "Photos"} Selected (
                      {(
                        selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0) /
                        (1024 * 1024)
                      ).toFixed(1)}{" "}
                      MB)
                    </span>
                    <button
                      type="button"
                      onClick={clearAllSelectedFiles}
                      className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-2 pr-1 max-h-[190px]">
                    {selectedFiles.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-[var(--foreground)] truncate max-w-[150px]">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[var(--muted-foreground)]">
                              {(item.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSelectedFile(item.id)}
                          className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                          title="Remove this photo"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 my-auto text-[var(--muted-foreground)]">
                  <ImageIcon size={28} className="mx-auto opacity-40 mb-1" />
                  <p className="text-xs font-medium">Selected previews appear here</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                    You can select multiple photos at once
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Row */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
            {selectedFiles.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllSelectedFiles}
                disabled={uploading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={selectedFiles.length === 0 || uploading}
              size="sm"
              className="gap-2 font-semibold shadow-xs"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading {selectedFiles.length} Photo{selectedFiles.length > 1 ? "s" : ""}...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  {selectedFiles.length > 1
                    ? `Save ${selectedFiles.length} Photos to Gallery`
                    : "Save Photo to Gallery"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* GALLERY DISPLAY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--foreground)]">
            Current Facility Gallery ({images.length})
          </h3>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            Sorted by priority: Building &gt; Interior &gt; Logo
          </span>
        </div>

        {images.length === 0 ? (
          <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-8 sm:p-12 text-center text-xs text-[var(--muted-foreground)]">
            <Building2 size={32} className="mx-auto text-[var(--primary)] opacity-40 mb-2" />
            <h4 className="font-semibold text-sm text-[var(--foreground)]">
              No location photos uploaded yet
            </h4>
            <p className="max-w-md mx-auto mt-1">
              Photographs of your center&apos;s entrance, signage, and donation area help visitors easily identify your physical facility during medical emergencies.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => {
              const fullUrl = getFullImageUrl(img.image_url);
              const isDeleting = deletingId === img.id;
              const isConfirming = confirmDeleteId === img.id;
              const catConfig =
                CATEGORIES.find((c) => c.type === img.image_type) || CATEGORIES[1];

              return (
                <Card
                  key={img.id}
                  className="group overflow-hidden border border-[var(--border)] bg-[var(--card)] p-0 shadow-xs transition hover:border-[var(--primary)]/40"
                >
                  {/* Photo Display */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={fullUrl}
                      alt={img.caption || `${bankName || "Facility"} photo`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Category Badge overlay */}
                    <div className="absolute top-2.5 left-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold backdrop-blur-md ${catConfig.badgeColor}`}
                      >
                        {catConfig.label}
                      </Badge>
                    </div>

                    {/* Quick Lightbox Action */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalImg(img)}
                      className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer backdrop-blur-sm"
                      title="View full size"
                      aria-label="View full size image"
                    >
                      <Eye size={13} />
                    </button>
                  </div>

                  {/* Card Content & Deletion */}
                  <div className="p-3.5 space-y-2">
                    <p className="text-xs font-medium text-[var(--foreground)] truncate">
                      {img.caption || "No caption provided"}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
                      <span>{img.created_at ? new Date(img.created_at).toLocaleDateString() : ""}</span>

                      {isConfirming ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-red-400 font-semibold">Delete?</span>
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => handleDelete(img.id)}
                            className="h-6 px-2 text-[10px]"
                          >
                            {isDeleting ? <Loader2 size={10} className="animate-spin" /> : "Yes"}
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-6 px-1.5 text-[10px]"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(img.id)}
                          className="flex items-center gap-1 text-[var(--muted-foreground)] hover:text-red-400 transition cursor-pointer text-[11px]"
                          title="Delete photo"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL-SIZE PREVIEW LIGHTBOX MODAL */}
      {previewModalImg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--border)] p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <img
              src={getFullImageUrl(previewModalImg.image_url)}
              alt={previewModalImg.caption || "Facility Full View"}
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain"
            />

            {previewModalImg.caption && (
              <p className="mt-2.5 px-3 py-1.5 text-center text-xs text-[var(--muted-foreground)] font-medium">
                {previewModalImg.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
