// src/pages/BookAppointment.jsx
//
// The actual "donate blood" action — requires an existing donor profile
// (checked on load; if missing, points back to /donor/register rather
// than showing a broken form). Two steps: pick a bank, then fill the
// health screening + appointment time for that bank.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMyDonorProfile } from "../services/donorService";
import { listBloodBanks } from "../services/bloodBankService";
import { bookAppointment } from "../services/appointmentService";
import { haversineDistanceKm } from "../utils/distance";
import { generateTimeSlots, formatSlotLabel, todayDateString } from "../utils/timeSlots";

export default function BookAppointment() {
  const [checkingDonor, setCheckingDonor] = useState(true);
  const [isDonor, setIsDonor] = useState(false);

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const [step, setStep] = useState("pickBank"); // 'pickBank' | 'details' | 'done'
  const [selectedBank, setSelectedBank] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const [form, setForm] = useState({
    date: "",
    time: "",
    weightKg: "",
    heightCm: "",
    hasChronicIllness: false,
    illnessDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    fetchMyDonorProfile()
      .then(() => setIsDonor(true))
      .catch(() => setIsDonor(false))
      .finally(() => setCheckingDonor(false));

    listBloodBanks()
      .then((data) => setBanks(data.banks))
      .finally(() => setLoadingBanks(false));
  }, []);

  function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const sortedBanks = userLocation
    ? [...banks]
        .map((b) => ({
          ...b,
          distanceKm:
            b.latitude != null && b.longitude != null
              ? haversineDistanceKm(userLocation.lat, userLocation.lng, parseFloat(b.latitude), parseFloat(b.longitude))
              : null,
        }))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    : banks;

  function pickBank(bank) {
    setSelectedBank(bank);
    setStep("details");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!form.date || !form.time) {
      setServerError("Please select both a date and a time slot.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await bookAppointment({
        bloodBankId: selectedBank.id,
        appointmentTime: `${form.date}T${form.time}:00`,
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        hasChronicIllness: form.hasChronicIllness,
        illnessDetails: form.illnessDetails || undefined,
      });
      setConfirmation(data.appointment);
      setStep("done");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingDonor || loadingBanks) {
    return <div className="py-24 text-center text-sm text-[var(--color-slate)]">Loading…</div>;
  }

  if (!isDonor) {
    return (
      <section className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Become a donor first
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-slate)]">
          You'll need a donor profile before booking a donation appointment — it only takes a minute.
        </p>
        <Link
          to="/donor/register"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Become a donor
        </Link>
      </section>
    );
  }

  if (step === "done") {
    return (
      <section className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Appointment booked
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-slate)]">
          Your token number is <span className="font-[var(--font-mono)] font-semibold text-[var(--color-ink)]">{confirmation.tokenNumber}</span>.
          Please arrive at {selectedBank.bank_name} at your scheduled time.
        </p>
        {confirmation.note && (
          <p className="mt-3 rounded-lg bg-[var(--color-urgent)]/10 px-3 py-2 text-xs text-[var(--color-urgent-dark)]">
            {confirmation.note}
          </p>
        )}
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </section>
    );
  }

  if (step === "details") {
    return (
      <section className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Book at {selectedBank.bank_name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-slate)]">
          A few quick health details, collected fresh for each donation.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Date</label>
            <input
              type="date"
              required
              min={todayDateString()}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Time</label>
            <select
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-mist)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
            >
              <option value="" disabled>Select a time…</option>
              {generateTimeSlots().map((slot) => (
                <option key={slot} value={slot}>{formatSlotLabel(slot)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-slate)]">Office hours only, 10:00 AM – 5:00 PM.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={form.hasChronicIllness}
                onChange={(e) => setForm({ ...form, hasChronicIllness: e.target.checked })}
              />
              I have a chronic illness or ongoing medical condition
            </label>
          </div>

          {form.hasChronicIllness && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Please briefly describe it</label>
              <textarea
                required
                rows={2}
                value={form.illnessDetails}
                onChange={(e) => setForm({ ...form, illnessDetails: e.target.value })}
                className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
              />
            </div>
          )}

          <p className="text-xs text-[var(--color-slate)]">
            This information helps the blood bank prepare. The final eligibility decision is always made
            by their medical staff at your appointment, not by this system.
          </p>

          {serverError && (
            <p className="rounded-lg bg-[var(--color-urgent)]/10 px-3 py-2 text-sm text-[var(--color-urgent-dark)]">
              {serverError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("pickBank")}
              className="rounded-full border border-[var(--color-mist)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)]"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
        Choose a blood bank
      </h1>
      <p className="mt-1 text-sm text-[var(--color-slate)]">Pick where you'd like to donate.</p>

      <button
        onClick={useMyLocation}
        disabled={locating}
        className="mt-4 rounded-full border border-[var(--color-mist)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] disabled:opacity-60"
      >
        {locating ? "Locating…" : userLocation ? "📍 Sorted by distance" : "Sort by distance"}
      </button>

      <div className="mt-6 space-y-3">
        {sortedBanks.length === 0 && (
          <p className="text-sm text-[var(--color-slate)]">No blood banks are registered yet.</p>
        )}
        {sortedBanks.map((bank) => (
          <div key={bank.id} className="flex items-center justify-between rounded-xl border border-[var(--color-mist)] bg-white p-5">
            <div>
              <p className="font-semibold text-[var(--color-ink)]">
                {bank.bank_name}
                {!!bank.is_verified_by_admin && (
                  <span className="ml-2 rounded-full bg-[var(--color-brand-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-dark)]">
                    Verified
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-[var(--color-slate)]">
                {bank.city}{bank.district ? `, ${bank.district}` : ""}
                {bank.distanceKm != null && ` · ${bank.distanceKm.toFixed(1)} km away`}
              </p>
            </div>
            <button
              onClick={() => pickBank(bank)}
              className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}