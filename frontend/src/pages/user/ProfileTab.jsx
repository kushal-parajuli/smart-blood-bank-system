// src/pages/user/ProfileTab.jsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";

export default function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [serverError, setServerError] = useState("");
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: user?.name || "", phone: user?.phone || "" } });

  async function onSubmit(formData) {
    setServerError("");
    setSaved(false);
    try {
      await updateProfile(formData);
      setSaved(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to update profile.");
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">Profile</h2>
      <p className="mt-1 text-sm text-[var(--color-slate)]">Update your name and phone number.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Full name</label>
          <input
            {...register("name", { required: "Name is required." })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Phone</label>
          <input
            {...register("phone")}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Email</label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border border-[var(--color-mist)] bg-[var(--color-paper)] px-4 py-2.5 text-sm text-[var(--color-slate)]"
          />
          <p className="mt-1 text-xs text-[var(--color-slate)]">Email can't be changed here.</p>
        </div>

        {serverError && <p className="text-sm text-[var(--color-urgent)]">{serverError}</p>}
        {saved && <p className="text-sm text-[var(--color-brand-dark)]">Profile updated.</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}