// src/pages/BloodBankRegister.jsx
//
// Separate from normal user Register.jsx on purpose — a blood bank
// account needs extra required fields (license number, location) that
// a normal user account never does, and hits a different backend
// endpoint (/api/blood-banks/register) with its own transactional logic.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../components/common/LocationPicker";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function BloodBankRegister() {
  const { registerBloodBank } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch("password");

  function handleLocationSelect({ lat, lng, address, city, district, province }) {
    setLocation({ lat, lng });
    if (address) setValue("address", address);
    if (city) setValue("city", city);
    if (district) setValue("district", district);
    if (province) setValue("province", province);
  }

  async function onSubmit(formData) {
    setServerError("");
    if (!location) {
      setServerError("Please set your bank's location using search, your current location, or the map.");
      return;
    }
    try {
      const { confirmPassword, ...payload } = formData;
      await registerBloodBank({
        ...payload,
        latitude: location.lat,
        longitude: location.lng,
      });
      navigate("/bank/dashboard");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
        Register your blood bank
      </h1>
      <p className="mt-1 text-sm text-[var(--color-slate)]">
        Manage inventory, respond to requests, and coordinate donor appointments.
        Your account is created immediately — verification by an administrator follows separately.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="border-b border-[var(--color-mist)] pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]">
          Account
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Contact person's name</label>
          <input
            {...register("name", { required: "Name is required." })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.name && <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Email</label>
          <input
            type="email"
            {...register("email", { required: "Email is required." })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.email && <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Phone <span className="text-[var(--color-slate)] font-normal">(optional)</span>
          </label>
          <input
            {...register("phone")}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Password</label>
          <input
            type="password"
            {...register("password", {
              required: "Password is required.",
              pattern: {
                value: PASSWORD_PATTERN,
                message: "Must be at least 8 characters, with uppercase, lowercase, a number, and a special character.",
              },
            })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.password && <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Confirm password</label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Please confirm your password.",
              validate: (value) => value === password || "Passwords do not match.",
            })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="border-b border-[var(--color-mist)] pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]">
          Blood bank details
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Bank name</label>
          <input
            {...register("bankName", { required: "Bank name is required." })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.bankName && <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.bankName.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">License number</label>
          <input
            {...register("licenseNumber", { required: "License number is required." })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
          {errors.licenseNumber && (
            <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.licenseNumber.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">City</label>
            <input
              {...register("city")}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">District</label>
            <input
              {...register("district")}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Address <span className="text-[var(--color-slate)] font-normal">(optional)</span>
          </label>
          <input
            {...register("address")}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Location</label>
          <LocationPicker value={location} onSelect={handleLocationSelect} />
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
          {isSubmitting ? "Registering…" : "Register blood bank"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-slate)]">
        Already registered? <Link to="/login" className="font-semibold text-[var(--color-brand)]">Log in</Link>
      </p>
    </section>
  );
}