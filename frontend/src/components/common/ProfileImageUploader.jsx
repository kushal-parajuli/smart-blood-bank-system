// src/components/common/ProfileImageUploader.jsx
// Healthcare-grade profile photo management component with upload, change, remove, and fallback avatar.

import { useState, useRef } from "react";
import { Camera, Trash2, Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import Avatar from "./Avatar";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfileImageUploader({ className }) {
  const { user, uploadAvatar, removeAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasPhoto = Boolean(user?.profile_picture_url);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size exceeds 5MB. Please choose a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    try {
      await uploadAvatar(file);
      setSuccess("Profile picture updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to upload profile picture. Please try again."
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await removeAvatar();
      setSuccess("Profile picture removed. Name initial will be displayed.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to remove profile picture."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Upload profile picture"
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Avatar Display */}
        <div className="relative group shrink-0 self-start">
          <Avatar
            src={user?.profile_picture_url}
            name={user?.name}
            size="2xl"
            className="h-20 w-20 sm:h-24 sm:w-24 text-2xl sm:text-3xl border-2 border-[var(--primary)]/30 shadow-md ring-4 ring-black/20"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            title={hasPhoto ? "Change profile photo" : "Upload profile photo"}
            aria-label={hasPhoto ? "Change profile photo" : "Upload profile photo"}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-md hover:bg-[var(--color-brand-hover)] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] cursor-pointer"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={15} />
            )}
          </button>
        </div>

        {/* Action Controls & Description */}
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">
              Profile Photo
            </h4>
            <p className="text-xs text-[var(--muted-foreground)]">
              {hasPhoto
                ? "This photo is visible across your requisitions and medical tokens."
                : "No photo uploaded yet. Your name initial is displayed as your public avatar."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Uploading...
                </>
              ) : hasPhoto ? (
                <>
                  <Upload size={13} />
                  Change Photo
                </>
              ) : (
                <>
                  <Upload size={13} />
                  Upload Photo
                </>
              )}
            </Button>

            {hasPhoto && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={handleRemovePhoto}
                className="gap-1.5 text-xs text-[var(--destructive)] hover:text-red-400 hover:bg-red-950/30"
              >
                <Trash2 size={13} />
                Remove
              </Button>
            )}
          </div>

          <p className="text-[11px] text-[var(--muted-foreground)]">
            Accepted formats: JPEG, PNG, WebP (Max 5MB).
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2.5 rounded-lg">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
