// src/pages/BookAppointment.jsx
//
// The actual "donate blood" action — requires an existing donor profile
// (checked on load; if missing, points back to /donor/register rather
// than showing a broken form). Two steps: pick a bank, then fill the
// health screening + appointment time for that bank.
//
// Gated server-side on:
//   (a) office hours (10:00 AM – 5:00 PM in 15-min increments)
//   (b) no overlapping pending appointment
//   (c) 90-day donation eligibility interval

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Ticket,
  Scale,
  Ruler,
} from "lucide-react";
import { fetchMyDonorProfile } from "../services/donorService";
import { listBloodBanks } from "../services/bloodBankService";
import { bookAppointment } from "../services/appointmentService";
import { haversineDistanceKm } from "../utils/distance";
import { generateTimeSlots, formatSlotLabel, todayDateString } from "../utils/timeSlots";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";
import BloodBankPhoto from "../components/bloodbank/BloodBankPhoto";
import BloodBankGalleryModal from "../components/bloodbank/BloodBankGalleryModal";

export default function BookAppointment() {
  const [checkingDonor, setCheckingDonor] = useState(true);
  const [isDonor, setIsDonor] = useState(false);

  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [step, setStep] = useState("pickBank"); // 'pickBank' | 'details' | 'done'
  const [selectedBank, setSelectedBank] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [galleryBank, setGalleryBank] = useState(null);

  const [form, setForm] = useState({
    date: todayDateString(),
    time: "10:00",
    weightKg: "",
    heightCm: "",
    hasChronicIllness: false,
    illnessDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    fetchMyDonorProfile()
      .then(() => {
        setIsDonor(true);
      })
      .catch(() => setIsDonor(false))
      .finally(() => setCheckingDonor(false));

    listBloodBanks()
      .then((data) => setBanks(data.banks || []))
      .catch(() => setBanks([]))
      .finally(() => setLoadingBanks(false));
  }, []);

  function useMyLocation() {
    if (userLocation) {
      setUserLocation(null);
      return;
    }
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

  const sortedBanks = (() => {
    let result = [...banks];
    if (bankSearch.trim()) {
      const q = bankSearch.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.bank_name?.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q) ||
          b.district?.toLowerCase().includes(q)
      );
    }
    if (userLocation) {
      result = result
        .map((b) => ({
          ...b,
          distanceKm:
            b.latitude != null && b.longitude != null
              ? haversineDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  parseFloat(b.latitude),
                  parseFloat(b.longitude)
                )
              : null,
        }))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
    return result;
  })();

  function pickBank(bank) {
    setSelectedBank(bank);
    setServerError("");
    setStep("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!form.date || !form.time) {
      setServerError("Please select both a date and an office-hours time slot.");
      return;
    }
    if (!form.weightKg || Number(form.weightKg) < 30) {
      setServerError("Please provide a realistic body weight in kilograms.");
      return;
    }
    if (!form.heightCm || Number(form.heightCm) < 100) {
      setServerError("Please provide a realistic height in centimeters.");
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(err.response?.data?.message || "Booking failed. Please check your eligibility and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // 1. LOADING STATE
  if (checkingDonor || loadingBanks) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-[var(--muted)]" />
          <div className="h-4 w-96 animate-pulse rounded-md bg-[var(--muted)]" />
          <Card className="animate-pulse border-[var(--border)] bg-[var(--card)] p-8">
            <div className="space-y-4">
              <div className="h-5 w-64 rounded-md bg-[var(--muted)]" />
              <div className="h-4 w-full rounded-md bg-[var(--muted)]" />
              <div className="h-10 w-32 rounded-full bg-[var(--muted)]" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 2. NOT A REGISTERED DONOR YET
  if (!isDonor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-16 sm:px-6">
        <Card className="mx-auto max-w-lg border-[var(--border)] bg-[var(--card)] p-6 sm:p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--primary)]">
            <HeartHandshake size={32} />
          </div>

          <h1 className="mt-5 font-[var(--font-display)] text-2xl font-bold text-[var(--foreground)]">
            Donor Profile Required
          </h1>

          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
            To schedule a blood donation, we first need to record your blood group and primary city. This ensures blood
            banks can safely prepare inventory tokens.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link to="/donor/register">
                Register as a Donor
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. STEP DONE (CONFIRMATION PASS)
  if (step === "done" && confirmation) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl border-[var(--border)] bg-[var(--card)] p-6 sm:p-10 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>

          <Badge
            variant="outline"
            className="mx-auto mt-4 gap-1 border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
          >
            Appointment Confirmed
          </Badge>

          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-extrabold text-[var(--foreground)] sm:text-3xl">
            You&apos;re Scheduled to Save Lives
          </h2>

          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Please present this digital confirmation token upon arrival at the facility.
          </p>

          {/* DIGITAL TOKEN CARD */}
          <div className="mt-6 overflow-hidden rounded-2xl border-2 border-dashed border-[var(--primary)]/30 bg-[var(--secondary)]/30 p-5 text-left text-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--primary)]/20 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Donation Token
                </span>
                <p className="font-[var(--font-mono)] text-xl font-extrabold text-[var(--primary)] sm:text-2xl">
                  {confirmation.tokenNumber}
                </p>
              </div>
              <Ticket size={28} className="text-[var(--primary)] opacity-60" />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
              <div>
                <span className="text-[11px] text-[var(--muted-foreground)]">Blood Bank:</span>
                <p className="font-semibold text-[var(--foreground)]">{selectedBank?.bank_name}</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {selectedBank?.city}{selectedBank?.district ? `, ${selectedBank.district}` : ""}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-[var(--muted-foreground)]">Scheduled Date &amp; Time:</span>
                <p className="font-[var(--font-mono)] font-semibold text-[var(--foreground)]">
                  {form.date} · {formatSlotLabel(form.time)}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">Office hours slot</p>
              </div>
            </div>

            {confirmation.note && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-semibold">Facility Note:</p>
                <p className="mt-0.5">{confirmation.note}</p>
              </div>
            )}
          </div>

          {/* DONOR INSTRUCTIONS */}
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-slate-50/70 p-4 text-left text-xs text-[var(--muted-foreground)] space-y-1.5">
            <p className="font-bold text-[var(--foreground)]">Preparation Guidelines:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Drink plenty of water (at least 500 mL) 2 hours before your appointment.</li>
              <li>Bring a government-issued photo ID (citizenship, driving license, or passport).</li>
              <li>Avoid strenuous physical activity immediately following donation.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link to="/dashboard">
                View in My Appointments
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 4. STEP DETAILS (HEALTH SCREENING & TIME FORM)
  if (step === "details") {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("pickBank")}
            className="gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft size={16} />
            Back to Bank Selection
          </Button>

          {/* FACILITY CALLOUT */}
          <Card className="border-[var(--primary)]/30 bg-[var(--secondary)]/40 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <BloodBankPhoto
                  src={selectedBank?.primary_image_url}
                  bankName={selectedBank?.bank_name}
                  className="h-12 w-12 rounded-xl"
                  onViewGallery={() => setGalleryBank(selectedBank)}
                  hasGallery={true}
                />
                {!selectedBank?.primary_image_url && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]">
                    <Building2 size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <h3
                    onClick={() => setGalleryBank(selectedBank)}
                    className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)] truncate hover:text-[var(--primary)] transition cursor-pointer"
                    title="Click to view facility gallery"
                  >
                    {selectedBank?.bank_name}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {selectedBank?.city}{selectedBank?.district ? `, ${selectedBank.district}` : ""}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--primary)] text-xs">
                Selected Facility
              </Badge>
            </div>
          </Card>

          {serverError && <Alert variant="destructive">{serverError}</Alert>}

          {/* HEALTH SCREENING FORM */}
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
            <div className="border-b border-[var(--border)] pb-4 mb-6">
              <h2 className="font-[var(--font-display)] text-xl font-bold text-[var(--foreground)]">
                Health Screening &amp; Slot
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Collected fresh at every donation to ensure clinical safety and schedule adherence.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* DATE & TIME */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Appointment Date <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      required
                      min={todayDateString()}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Select today or a future date</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Preferred Time Slot <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <select
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  >
                    {generateTimeSlots().map((slot) => (
                      <option key={slot} value={slot}>
                        {formatSlotLabel(slot)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    Office hours only (10:00 AM – 5:00 PM)
                  </p>
                </div>
              </div>

              {/* PHYSICAL METRICS */}
              <div className="border-t border-[var(--border)] pt-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Physical Vitals Screening <span className="text-[var(--destructive)]">*</span>
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="mb-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Scale size={13} /> Body Weight (kg)
                    </span>
                    <Input
                      type="number"
                      step="0.5"
                      min="30"
                      max="200"
                      required
                      placeholder="e.g. 62"
                      value={form.weightKg}
                      onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                    />
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      Guideline: ≥ 45 kg for safe whole blood extraction
                    </p>
                  </div>

                  <div>
                    <span className="mb-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Ruler size={13} /> Height (cm)
                    </span>
                    <Input
                      type="number"
                      step="1"
                      min="100"
                      max="240"
                      required
                      placeholder="e.g. 170"
                      value={form.heightCm}
                      onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                    />
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Measured standing height</p>
                  </div>
                </div>
              </div>

              {/* MEDICAL CONDITION CHECKBOX */}
              <div className="border-t border-[var(--border)] pt-6">
                <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-slate-50/50 p-4 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={form.hasChronicIllness}
                    onChange={(e) => setForm({ ...form, hasChronicIllness: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[var(--foreground)]">
                      I have an existing medical condition or chronic illness
                    </span>
                    <p className="text-[var(--muted-foreground)]">
                      Check if you are under medication or have cardiovascular, endocrine, or respiratory conditions.
                    </p>
                  </div>
                </label>

                {form.hasChronicIllness && (
                  <div className="mt-3 space-y-1">
                    <label className="block text-xs font-semibold text-[var(--foreground)]">
                      Please describe your condition / medication: <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={form.illnessDetails}
                      onChange={(e) => setForm({ ...form, illnessDetails: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                      placeholder="Mention illness name, recent surgeries, or ongoing prescription medication..."
                    />
                  </div>
                )}
              </div>

              {/* DISCLAIMER NOTICE */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-sky-700 shrink-0 mt-0.5" />
                <p>
                  This self-reported screening expedites preparation. Certified phlebotomists and medical staff will
                  conduct on-site hemoglobin and blood pressure verification before donation.
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-[var(--border)] pt-5 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("pickBank")}
                  className="w-full sm:w-auto"
                >
                  Change Facility
                </Button>

                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full sm:w-auto gap-2 shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Scheduling Token...
                    </>
                  ) : (
                    <>
                      <span>Confirm Appointment</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // 5. STEP 1: PICK A BLOOD BANK
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* HEADER */}
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-hover)] shadow-xs"
          >
            <HeartHandshake size={13} className="text-[var(--primary)]" />
            Voluntary Donation Booking
          </Badge>

          <h1 className="font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Book a Blood Donation
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Select a verified blood bank or hospital donation center in Nepal to schedule your contribution.
          </p>
        </div>

        {/* SEARCH & PROXIMITY TOOLBAR */}
        <Card className="border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-center">
            <div className="relative sm:col-span-7">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                <Building2 size={16} />
              </div>
              <Input
                type="text"
                placeholder="Filter by facility name, city, or district..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="pl-9"
              />
              {bankSearch && (
                <button
                  type="button"
                  onClick={() => setBankSearch("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="sm:col-span-5">
              <Button
                type="button"
                variant={userLocation ? "default" : "outline"}
                onClick={useMyLocation}
                disabled={locating}
                className="w-full gap-2 text-xs font-medium sm:text-sm"
              >
                {locating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Detecting GPS...
                  </>
                ) : userLocation ? (
                  <>
                    <Navigation size={14} className="fill-current" />
                    Sorted by Proximity
                  </>
                ) : (
                  <>
                    <Navigation size={14} />
                    Sort by Nearest (GPS)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* BANKS LIST */}
        <div className="space-y-3">
          {sortedBanks.length === 0 ? (
            <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-8 text-center sm:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Building2 size={24} />
              </div>
              <h3 className="mt-4 font-[var(--font-display)] text-base font-semibold text-[var(--foreground)]">
                No matching blood banks found
              </h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Try clearing your search query or expanding your location radius.
              </p>
              {bankSearch && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBankSearch("")}
                  className="mt-4"
                >
                  Clear Search Filter
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {sortedBanks.map((bank) => (
                <Card
                  key={bank.id}
                  className="border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 transition-all hover:border-[var(--primary)]/40 shadow-xs"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                      <BloodBankPhoto
                        src={bank.primary_image_url}
                        bankName={bank.bank_name}
                        className="w-20 h-16 sm:w-24 sm:h-20"
                        onViewGallery={() => setGalleryBank(bank)}
                        hasGallery={true}
                      />

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => setGalleryBank(bank)}
                            className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)] sm:text-lg hover:text-[var(--primary)] transition cursor-pointer"
                            title="Click to view facility gallery"
                          >
                            {bank.bank_name}
                          </h3>
                          {!!bank.is_verified_by_admin && (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                            >
                              <ShieldCheck size={11} className="text-emerald-600" /> Verified Facility
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="shrink-0 text-[var(--primary)]" />
                            {bank.city}
                            {bank.district ? `, ${bank.district}` : ""}
                            {bank.province ? ` (${bank.province})` : ""}
                          </span>

                        {bank.distanceKm != null && (
                          <span className="flex items-center gap-1 font-semibold text-[var(--primary)]">
                            <Navigation size={12} className="shrink-0 fill-current" />
                            {bank.distanceKm.toFixed(1)} km away
                          </span>
                        )}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => pickBank(bank)}
                      className="gap-2 shrink-0 w-full sm:w-auto shadow-xs"
                    >
                      <span>Book Appointment</span>
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Facility Gallery & Location Modal */}
      <BloodBankGalleryModal
        bank={galleryBank}
        isOpen={!!galleryBank}
        onClose={() => setGalleryBank(null)}
      />
    </div>
  );
}