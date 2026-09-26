// src/pages/user/ProfileTab.jsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Phone, Mail, Loader2, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Alert } from "../../components/ui/alert";
import Avatar from "../../components/common/Avatar";

export default function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  async function onSubmit(formData) {
    setServerError("");
    setSaved(false);
    try {
      await updateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to update profile.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
          Account Profile
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Manage your personal details and contact preferences.
        </p>
      </div>

      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {saved && (
        <Alert variant="success">
          Your profile information has been saved successfully.
        </Alert>
      )}

      <Card className="border-[var(--border)] bg-[var(--card)] p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-5 mb-6">
          <Avatar
            src={user?.profile_picture_url}
            alt={user?.name || "User"}
            className="h-16 w-16 text-lg border-2 border-[var(--primary)]/20 shadow-xs"
          />
          <div>
            <h3 className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)]">
              {user?.name || "User Account"}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--primary)]">
              <Shield size={12} />
              <span className="capitalize">{user?.role || "user"} role</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
              Full Legal Name <span className="text-[var(--destructive)]">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                <User size={15} />
              </div>
              <Input
                className="pl-9"
                placeholder="Enter full name"
                {...register("name", { required: "Name is required." })}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-[var(--destructive)]">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
              Mobile Contact Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                <Phone size={15} />
              </div>
              <Input
                className="pl-9"
                type="tel"
                placeholder="e.g. 9841000000"
                {...register("phone")}
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Used for critical blood dispatch and donation notifications.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
              Account Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                <Mail size={15} />
              </div>
              <Input
                className="pl-9 bg-slate-50 cursor-not-allowed opacity-80"
                value={user?.email || ""}
                disabled
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              Primary login identifier cannot be edited directly.
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--border)] flex justify-end">
            <Button type="submit" disabled={isSubmitting} size="sm" className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}