// src/pages/Register.jsx
//
// This form only ever creates a normal user account — matching the
// backend's /api/auth/register, which is deliberately restricted to
// role: user (see authController.js). Blood bank registration needs its
// own separate page later (extra fields: license number, address, etc.),
// hitting a different endpoint (/api/blood-banks/register).

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Mirrors the backend's policy exactly (see backend/src/utils/validators.js) —
// kept in sync deliberately so the form's error message and the server's
// error message never contradict each other.
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  async function onSubmit(formData) {
    setServerError("");
    try {
      // confirmPassword is a frontend-only check — never sent to the backend,
      // which has no use for it (it only ever stores the one password).
      const { confirmPassword, ...payload } = formData;
      await registerUser(payload);
      navigate("/");
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-16">
      <div className="w-full">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-[var(--color-slate)]">
          Search blood availability, register as a donor, or request blood in an emergency.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Full name
            </label>
            <input
              {...register("name", { required: "Name is required." })}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="Your name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Email
            </label>
            <input
              type="email"
              {...register("email", { required: "Email is required." })}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Phone <span className="text-[var(--color-slate)] font-normal">(optional)</span>
            </label>
            <input
              {...register("phone")}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="98XXXXXXXX"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Password
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required.",
                pattern: {
                  value: PASSWORD_PATTERN,
                  message:
                    "Must be at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.",
                },
              })}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="e.g. Blood@2026"
            />
            <p className="mt-1 text-xs text-[var(--color-slate)]">
              At least 8 characters, with uppercase, lowercase, a number, and a special character.
            </p>
            {errors.password && (
              <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
              Confirm password
            </label>
            <input
              type="password"
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value) => value === password || "Passwords do not match.",
              })}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="Re-enter your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-lg bg-[var(--color-urgent)]/10 px-3 py-2 text-sm text-[var(--color-urgent-dark)]">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)] disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-slate)]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[var(--color-brand)]">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--color-slate)]">
          Registering a blood bank?{" "}
          <Link to="/register/blood-bank" className="font-semibold text-[var(--color-brand)]">
            Register here
          </Link>
        </p>
      </div>
    </section>
  );
}