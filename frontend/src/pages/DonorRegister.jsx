// src/pages/DonorRegister.jsx
//
// One-time donor profile setup: blood group + location. This is
// deliberately separate from "booking a donation" (that's the next
// page we'll build) — this page just establishes that the logged-in
// user IS a donor and where they're based, so nearest-bank matching
// and the fallback-donor search can work later.

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import LocationPicker from "../components/common/LocationPicker";
import { registerDonor, fetchMyDonorProfile } from "../services/donorService";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorRegister() {
  const [location, setLocation] = useState(null);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyDonor, setAlreadyDonor] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingProfile, setExistingProfile] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  // Check BEFORE showing the form whether this user already has a donor
  // profile — without this, the page would always show an empty form,
  // even for someone who registered as a donor days ago.
  useEffect(() => {
    async function checkExisting() {
      try {
        const data = await fetchMyDonorProfile();
        setExistingProfile(data.donor);
        setAlreadyDonor(true);
      } catch {
        // 404 here just means "not a donor yet" — the expected case
        // for a first-time visitor, not an error worth showing.
      } finally {
        setCheckingExisting(false);
      }
    }
    checkExisting();
  }, []);

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
      setServerError("Please set your location using search, your current location, or the map.");
      return;
    }
    try {
      await registerDonor({
        ...formData,
        latitude: location.lat,
        longitude: location.lng,
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  if (checkingExisting) {
    return <div className="py-24 text-center text-sm text-[var(--color-slate)]">Checking your donor status…</div>;
  }

  if (alreadyDonor) {
    return (
      <section className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          You're already a registered donor
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-slate)]">
          Blood group <span className="font-semibold text-[var(--color-ink)]">{existingProfile?.blood_group}</span>
          {existingProfile?.city && <> · based in {existingProfile.city}</>}
        </p>
        <p className="mt-2 text-sm text-[var(--color-slate)]">
          Ready to donate? Book your appointment whenever suits you.
        </p>
        <Link
          to="/donate"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Book a donation
        </Link>
        <div>
          <Link to="/" className="mt-3 inline-block text-sm text-[var(--color-slate)] underline">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          You're registered as a donor
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-slate)]">
          Thank you. You can book your first donation appointment right away.
        </p>
        <Link
          to="/donate"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Book a donation
        </Link>
        <div>
          <Link to="/" className="mt-3 inline-block text-sm text-[var(--color-slate)] underline">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
        Become a donor
      </h1>
      <p className="mt-1 text-sm text-[var(--color-slate)]">
        Set this up once. You'll be able to book donation appointments at
        any bank near you afterward.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Blood group
          </label>
          <select
            {...register("bloodGroup", { required: "Please select your blood group." })}
            className="w-full rounded-lg border border-[var(--color-mist)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
            defaultValue=""
          >
            <option value="" disabled>Select…</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.bloodGroup && (
            <p className="mt-1 text-xs text-[var(--color-urgent)]">{errors.bloodGroup.message}</p>
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
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Location
          </label>
          <LocationPicker value={location} onSelect={handleLocationSelect} />
        </div>

        {serverError && (
          <div className="rounded-lg bg-[var(--color-urgent)]/10 px-3 py-2 text-sm text-[var(--color-urgent-dark)]">
            {serverError}
            {alreadyDonor && (
              <p className="mt-1">
                <Link to="/" className="font-semibold underline">Return home</Link>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)] disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Become a donor"}
        </button>
      </form>
    </section>
  );
}