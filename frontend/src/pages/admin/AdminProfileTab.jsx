// src/pages/admin/AdminProfileTab.jsx
// Comprehensive administrative profile management and security control center.
// Allows administrators to modify profile picture, update identity details (username/name, email, phone),
// and securely change administrator credentials with complexity verification.

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { changePassword } from "../../services/authService";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import ProfileImageUploader from "../../components/common/ProfileImageUploader";

export default function AdminProfileTab() {
  const { user, updateProfile } = useAuth();

  // Profile details state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password change state
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  // Details form
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    formState: { errors: detailErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Password form
  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPwForm,
    watch: watchPw,
    formState: { errors: pwFormErrors },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchNewPassword = watchPw("newPassword", "");

  // Real-time password requirement checks
  const hasMinLength = watchNewPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(watchNewPassword);
  const hasLower = /[a-z]/.test(watchNewPassword);
  const hasNumber = /[0-9]/.test(watchNewPassword);
  const hasSpecial = /[@$!%*?&#^_-]/.test(watchNewPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  // Handler for Profile details
  async function onSaveProfile(data) {
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      await updateProfile({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone ? data.phone.trim() : null,
      });

      setProfileSuccess("Administrator profile details updated successfully.");
      setTimeout(() => setProfileSuccess(""), 4500);
    } catch (err) {
      setProfileError(
        err.response?.data?.message ||
          "Failed to update administrator profile. Please verify your details."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // Handler for Password update
  async function onSavePassword(data) {
    if (data.newPassword !== data.confirmPassword) {
      setPwError("New password and confirmation password do not match.");
      return;
    }

    if (!isPasswordValid) {
      setPwError("New password does not fulfill all required security complexity rules.");
      return;
    }

    setPwSaving(true);
    setPwSuccess("");
    setPwError("");

    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setPwSuccess("Administrator password changed successfully. Your account is secured.");
      resetPwForm();
      setTimeout(() => setPwSuccess(""), 4500);
    } catch (err) {
      setPwError(
        err.response?.data?.message ||
          "Failed to update password. Please check your current password and try again."
      );
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-950/70 border border-purple-800/60 text-purple-300 shadow-sm">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
                Administrator Identity &amp; Access Controls
              </h2>
              <Badge className="border-purple-800/60 bg-purple-950/60 text-purple-300 text-[10px]">
                Root Admin
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Manage your administrator avatar, username, official email, and credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--color-surface-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border)] self-start sm:self-auto">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>System Role: <strong>Administrator</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Profile Picture & Account Snapshot */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
            <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--foreground)] mb-1">
              Admin Profile Picture
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Your avatar appears in the administrative header and system audit logs.
            </p>

            <ProfileImageUploader />
          </Card>

          {/* System Security Info */}
          <Card className="border-[var(--border)] bg-[var(--color-surface-subtle)] p-5 shadow-xs text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
              <Key size={14} className="text-[var(--primary)]" />
              <span>Privileged Account Security</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              Administrator accounts possess elevated privileges across blood bank approvals, donor credentialing, and user governance. Keep your password robust and unique.
            </p>
            <div className="pt-2 border-t border-[var(--border)] flex justify-between text-[11px] text-[var(--muted-foreground)]">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Active &amp; Verified
              </span>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Edit Details Form & Password Change Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* PROFILE DETAILS FORM CARD */}
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-xs">
            <div className="border-b border-[var(--border)] pb-3 mb-5">
              <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <User size={16} className="text-[var(--primary)]" />
                Administrator Information
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Update your display name, username, official email, and mobile contact number.
              </p>
            </div>

            {profileError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                <span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-xs text-emerald-400">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDetails(onSaveProfile)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                  Full Legal Name / Username <span className="text-[var(--destructive)]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                    <User size={15} />
                  </div>
                  <Input
                    className="pl-9 text-xs"
                    placeholder="e.g. Kushal Parajuli (Admin)"
                    {...registerDetails("name", {
                      required: "Name / Username is required.",
                      minLength: { value: 2, message: "Name must be at least 2 characters." },
                    })}
                  />
                </div>
                {detailErrors.name && (
                  <p className="mt-1 text-xs text-[var(--destructive)]">
                    {detailErrors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Official Email Address <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                      <Mail size={15} />
                    </div>
                    <Input
                      className="pl-9 text-xs"
                      type="email"
                      placeholder="admin@smartbloodbank.org"
                      {...registerDetails("email", {
                        required: "Email address is required.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Please enter a valid email address.",
                        },
                      })}
                    />
                  </div>
                  {detailErrors.email && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">
                      {detailErrors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Direct Phone / Emergency Contact
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                      <Phone size={15} />
                    </div>
                    <Input
                      className="pl-9 text-xs"
                      type="tel"
                      placeholder="e.g. 9841000000"
                      {...registerDetails("phone")}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={profileSaving}
                  className="gap-2 font-semibold shadow-xs"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving Details...
                    </>
                  ) : (
                    "Save Admin Details"
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* PASSWORD & CREDENTIALS FORM CARD */}
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-xs">
            <div className="border-b border-[var(--border)] pb-3 mb-5">
              <h3 className="font-[var(--font-display)] text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Lock size={16} className="text-amber-500" />
                Change Password &amp; Credentials
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Verify your current administrator password before establishing new access credentials.
              </p>
            </div>

            {pwError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                <span>{pwError}</span>
              </div>
            )}
            {pwSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-3 text-xs text-emerald-400">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPw(onSavePassword)} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                  Current Password <span className="text-[var(--destructive)]">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                    <Key size={15} />
                  </div>
                  <Input
                    className="pl-9 pr-9 text-xs"
                    type={showCurrentPw ? "text" : "password"}
                    placeholder="Enter current password"
                    {...registerPw("currentPassword", {
                      required: "Current password is required to verify identity.",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwFormErrors.currentPassword && (
                  <p className="mt-1 text-xs text-[var(--destructive)]">
                    {pwFormErrors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    New Password <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                      <Lock size={15} />
                    </div>
                    <Input
                      className="pl-9 pr-9 text-xs"
                      type={showNewPw ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      {...registerPw("newPassword", {
                        required: "New password is required.",
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pwFormErrors.newPassword && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">
                      {pwFormErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Confirm New Password <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                      <Lock size={15} />
                    </div>
                    <Input
                      className="pl-9 pr-9 text-xs"
                      type={showConfirmPw ? "text" : "password"}
                      placeholder="Re-enter new password"
                      {...registerPw("confirmPassword", {
                        required: "Please confirm your new password.",
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pwFormErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">
                      {pwFormErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Complexity Checklist */}
              {watchNewPassword && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] p-3 text-[11px] space-y-1.5 animate-in fade-in duration-200">
                  <p className="font-semibold text-[var(--foreground)] mb-1">
                    Password Security Requirements:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <CheckCircle2 size={12} className={hasMinLength ? "opacity-100" : "opacity-40"} />
                      At least 8 characters
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasUpper ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <CheckCircle2 size={12} className={hasUpper ? "opacity-100" : "opacity-40"} />
                      One uppercase letter (A-Z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasLower ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <CheckCircle2 size={12} className={hasLower ? "opacity-100" : "opacity-40"} />
                      One lowercase letter (a-z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasNumber ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <CheckCircle2 size={12} className={hasNumber ? "opacity-100" : "opacity-40"} />
                      One numerical digit (0-9)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasSpecial ? "text-emerald-400" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      <CheckCircle2 size={12} className={hasSpecial ? "opacity-100" : "opacity-40"} />
                      One special symbol (@$!%*?&#^_-)
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={pwSaving}
                  className="gap-2 font-semibold shadow-xs bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {pwSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Administrator Password"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
