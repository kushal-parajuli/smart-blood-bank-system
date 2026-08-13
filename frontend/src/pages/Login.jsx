// src/pages/Login.jsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit(formData) {
    setServerError("");
    try {
      await login(formData);
      // Every role lands on the homepage for now — role-specific
      // dashboards get their own routes once we build them, at which
      // point this redirect logic will branch by user.role.
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
          Log in
        </h1>
        <p className="mt-1 text-sm text-[var(--color-slate)]">
          Welcome back — enter your details to continue.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
              Password
            </label>
            <input
              type="password"
              {...register("password", { required: "Password is required." })}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.password.message}</p>
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
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-slate)]">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[var(--color-brand)]">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}