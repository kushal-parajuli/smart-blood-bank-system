// src/pages/DonorRegister.jsx
//
// One-time donor profile setup: blood group + location. This is
// deliberately separate from "booking a donation" — this page just
// establishes that the logged-in user IS a donor and where they're based,
// so nearest-bank matching and the fallback-donor search can work later.

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";
import LocationPicker from "../components/common/LocationPicker";
import { registerDonor, fetchMyDonorProfile } from "../services/donorService";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorRegister() {
  const [location, setLocation] = useState(null);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyDonor, setAlreadyDonor] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingProfile, setExistingProfile] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    async function checkExisting() {
      try {
        const data = await fetchMyDonorProfile();
        setExistingProfile(data?.donor || null);
        setAlreadyDonor(true);
      } catch {
        // 404 here just means "not a donor yet"
      } finally {
        setCheckingExisting(false);
      }
    }
    checkExisting();
  }, []);

  function handleGroupSelect(group) {
    setSelectedGroup(group);
    setValue("bloodGroup", group, { shouldValidate: true });
  }

  function handleLocationSelect({ lat, lng, address, city, district, province }) {
    setLocation({ lat, lng });
    if (address) setValue("address", address);
    if (city) setValue("city", city);
    if (district) setValue("district", district);
    if (province) setValue("province", province);
  }

  async function onSubmit(formData) {
    setServerError("");
    const bloodGroup = selectedGroup || formData.bloodGroup;

    if (!bloodGroup) {
      setServerError("Please select your blood group.");
      return;
    }

    if (!location) {
      setServerError("Please set your location using search, GPS, or by clicking on the map.");
      return;
    }

    try {
      await registerDonor({
        ...formData,
        bloodGroup,
        latitude: location.lat,
        longitude: location.lng,
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed. Please check your information and try again.");
    }
  }

  // 1. CHECKING STATUS SKELETON
  if (checkingExisting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-md bg-[var(--muted)]" />
          <div className="h-9 w-64 animate-pulse rounded-md bg-[var(--muted)]" />
          <Card className="animate-pulse border-[var(--border)] bg-[var(--card)] p-8 space-y-4">
            <div className="h-4 w-full rounded-md bg-[var(--muted)]" />
            <div className="h-10 w-full rounded-md bg-[var(--muted)]" />
          </Card>
        </div>
      </div>
    );
  }

  // 2. ALREADY REGISTERED DONOR
  if (alreadyDonor) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-16 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-lg border-[var(--border)] bg-[var(--card)] p-6 sm:p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--primary)]">
            <HeartHandshake size={32} />
          </div>

          <Badge
            variant="outline"
            className="mx-auto mt-4 gap-1 border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
          >
            <ShieldCheck size={12} className="text-emerald-600" />
            Active Donor Profile
          </Badge>

          <h1 className="mt-3 font-[var(--font-display)] text-2xl font-bold text-[var(--foreground)]">
            You Are an Active Donor
          </h1>

          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Your voluntary profile is already registered in our central donor registry.
          </p>

          {/* PROFILE SUMMARY BADGE CARD */}
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-[var(--border)] bg-[var(--color-paper)] p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Blood Group:</span>
              <span className="font-[var(--font-mono)] font-bold text-base text-[var(--primary)]">
                {existingProfile?.blood_group || "Recorded"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Location:</span>
              <span className="font-semibold text-[var(--foreground)]">
                {existingProfile?.city}
                {existingProfile?.district ? `, ${existingProfile.district}` : ""}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted-foreground)]">Verification:</span>
              <span className="font-medium text-emerald-700">
                {existingProfile?.is_verified_by_admin ? "Admin Verified" : "Self-Registered"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link to="/donate">
                Schedule a Donation
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. REGISTRATION SUCCESS
  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-16 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-lg border-[var(--border)] bg-[var(--card)] p-6 sm:p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-4 font-[var(--font-display)] text-2xl font-bold text-[var(--foreground)]">
            Welcome to the Donor Network
          </h1>

          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            Thank you for registering. Your voluntary pledge helps hospitals respond swiftly to emergencies. You can now schedule your first donation appointment.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link to="/donate">
                Book First Donation
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/dashboard">Go to Profile</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 4. REGISTRATION FORM
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* HEADER */}
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-hover)] shadow-xs"
          >
            <HeartHandshake size={13} className="text-[var(--primary)]" />
            Voluntary Lifesaver Registry
          </Badge>

          <h1 className="font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Register as a Blood Donor
          </h1>

          <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Set up your donor profile once. Your location enables proximity-based notifications when nearby patients or blood banks have urgent compatible requests.
          </p>
        </div>

        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            {/* BLOOD GROUP SELECTION */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Your Blood Group <span className="text-[var(--destructive)]">*</span>
                </label>
                {selectedGroup && (
                  <span className="font-[var(--font-mono)] text-xs font-bold text-[var(--primary)]">
                    Selected: {selectedGroup}
                  </span>
                )}
              </div>

              <input
                type="hidden"
                {...register("bloodGroup", { required: "Please select your blood group." })}
                value={selectedGroup}
              />

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {BLOOD_GROUPS.map((group) => {
                  const isSelected = selectedGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => handleGroupSelect(group)}
                      className={`flex h-12 flex-col items-center justify-center rounded-xl border text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/25 scale-[1.03]"
                          : "border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--foreground)] hover:border-[var(--primary)]/40 hover:bg-[var(--color-surface-elevated)]"
                      }`}
                    >
                      <span className="font-[var(--font-mono)] text-base">{group}</span>
                    </button>
                  );
                })}
              </div>
              {errors.bloodGroup && (
                <p className="mt-1.5 text-xs font-medium text-[var(--destructive)]">
                  {errors.bloodGroup.message}
                </p>
              )}
            </div>

            {/* LOCATION DETAILS */}
            <div className="border-t border-[var(--border)] pt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Primary Location / Coordinates <span className="text-[var(--destructive)]">*</span>
                </label>
                <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                  Use search or click your neighborhood on the map. This enables proximity matching with local blood banks.
                </p>
                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <LocationPicker value={location} onSelect={handleLocationSelect} />
                </div>
              </div>

              {/* CITY & DISTRICT */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">City / Municipality</label>
                  <Input
                    type="text"
                    placeholder="e.g. Kathmandu"
                    {...register("city")}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">District</label>
                  <Input
                    type="text"
                    placeholder="e.g. Kathmandu"
                    {...register("district")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                  Street Address / Ward <span className="text-xs text-[var(--muted-foreground)] font-normal">(optional)</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Ward 4, New Baneshwor"
                  {...register("address")}
                />
              </div>
            </div>

            {/* PRIVACY & INFORMATIONAL NOTE */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-xs text-sky-900 flex items-start gap-2.5">
              <Info size={16} className="text-sky-700 shrink-0 mt-0.5" />
              <p>
                Your phone number and private contact info are <strong>never shown publicly</strong>. When a blood bank has an urgent need, system-mediated notifications or nudges are sent safely through the platform.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="border-t border-[var(--border)] pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedGroup}
                size="lg"
                className="w-full gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Recording Donor Profile...
                  </>
                ) : (
                  <>
                    <span>Complete Donor Registration</span>
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