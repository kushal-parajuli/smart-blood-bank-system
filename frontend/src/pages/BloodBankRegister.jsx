// src/pages/BloodBankRegister.jsx
//
// Separate from normal user Register.jsx on purpose — a blood bank
// account needs extra required fields (license number, location) that
// a normal user account never does, and hits a different backend
// endpoint (/api/blood-banks/register) with its own transactional logic.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2,
  User,
  FileCheck,
  ArrowRight,
  Loader2,
  Info,
  Clock,
  CheckCircle2,
  ShieldAlert,
  MapPin,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../components/common/LocationPicker";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function BloodBankRegister() {
  const { registerBloodBank } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [serverError, setServerError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

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
      setServerError("Please set your bank's geographical coordinates on the map below.");
      return;
    }
    try {
      const payload = { ...formData };
      delete payload.confirmPassword;
      await registerBloodBank({
        ...payload,
        latitude: location.lat,
        longitude: location.lng,
      });
      setSubmittedData(formData);
      setIsSubmitted(true);
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed. Please check the details and try again.");
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-16 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl border-[var(--border)] bg-[var(--card)] p-6 sm:p-10 text-center shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
            <Clock size={36} className="animate-pulse" />
          </div>

          <Badge
            variant="outline"
            className="mx-auto mt-4 gap-1.5 border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
          >
            <ShieldAlert size={13} className="text-amber-600" />
            Verification Required
          </Badge>

          <h1 className="mt-4 font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Registration Submitted for Review
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Thank you for registering <strong className="text-[var(--foreground)]">{submittedData?.bankName}</strong>.
            Institutional accounts must be reviewed and verified by a system administrator before access is granted.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--border)] bg-[var(--color-paper)] p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Facility Name:</span>
              <span className="font-bold text-[var(--foreground)]">{submittedData?.bankName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">License Number:</span>
              <span className="font-mono font-semibold text-[var(--primary)]">{submittedData?.licenseNumber}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Location:</span>
              <span className="font-medium text-[var(--foreground)]">
                {submittedData?.city}{submittedData?.district ? `, ${submittedData.district}` : ""}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--muted-foreground)]">Contact Email:</span>
              <span className="font-medium text-[var(--foreground)]">{submittedData?.email}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 text-left flex items-start gap-2.5">
            <Info size={16} className="text-sky-700 shrink-0 mt-0.5" />
            <p>
              Once an administrator approves your license, you will be able to log in to your portal using your email and password to begin managing blood inventory.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto gap-2">
              <Link to="/login">
                Go to Portal Login
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* HEADER */}
        <div className="space-y-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-brand-hover)] shadow-xs"
          >
            <Building2 size={13} className="text-[var(--primary)]" />
            Institutional Blood Bank Onboarding
          </Badge>

          <h1 className="font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Register Your Blood Bank
          </h1>

          <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Establish your facility portal to manage blood batch inventory, fulfill hospital requests, and coordinate voluntary donor appointments across Nepal.
          </p>
        </div>

        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* SECTION 1: ACCOUNT CREDENTIALS */}
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-4">
                <User size={16} className="text-[var(--primary)]" />
                <h3 className="font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                  1. Administrator &amp; Account Credentials
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Authorized Representative Name <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <Input
                    placeholder="Full name of director, manager, or in-charge"
                    {...register("name", { required: "Representative name is required." })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                      Official Email <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="bank@hospital.org"
                      {...register("email", { required: "Email is required." })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-[var(--destructive)]">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                      Emergency Contact Phone <span className="text-xs text-[var(--muted-foreground)] font-normal">(optional)</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. 01-4412345 / 9800000000"
                      {...register("phone")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                      Password <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Min 8 chars, 1 upper, 1 num, 1 sym"
                      {...register("password", {
                        required: "Password is required.",
                        pattern: {
                          value: PASSWORD_PATTERN,
                          message: "At least 8 chars with uppercase, lowercase, number, and special character.",
                        },
                      })}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-[var(--destructive)]">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                      Confirm Password <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password.",
                        validate: (value) => value === password || "Passwords do not match.",
                      })}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-[var(--destructive)]">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: FACILITY IDENTITY */}
            <div>
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-4">
                <FileCheck size={16} className="text-[var(--primary)]" />
                <h3 className="font-[var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">
                  2. Facility Identity &amp; Licensing
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Official Facility / Bank Name <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Nepal Red Cross Society Central Blood Transfusion Service"
                    {...register("bankName", { required: "Bank name is required." })}
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">{errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Registration / Operating License Number <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <Input
                    placeholder="e.g. MOHP-BB-2024-9128"
                    {...register("licenseNumber", { required: "License number is required." })}
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">{errors.licenseNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">City / Municipality</label>
                    <Input placeholder="e.g. Kathmandu" {...register("city")} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">District</label>
                    <Input placeholder="e.g. Kathmandu" {...register("district")} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                    Physical Street Address / Ward <span className="text-xs text-[var(--muted-foreground)] font-normal">(optional)</span>
                  </label>
                  <Input placeholder="e.g. Exhibition Road, Bhrikutimandap" {...register("address")} />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[var(--foreground)]">
                    Geographical Location Pin <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <p className="mb-2 text-xs text-[var(--muted-foreground)]">
                    Pin your hospital or center on the map. This enables precise Haversine distance calculations when patients search for emergency blood.
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                    <LocationPicker value={location} onSelect={handleLocationSelect} />
                  </div>
                </div>
              </div>
            </div>

            {/* VERIFICATION NOTICE */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>Admin Approval Required:</strong> Your blood bank registration is submitted directly to the system administrator queue. Administrators review and approve facility operating licenses before account login and blood inventory management are enabled.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="border-t border-[var(--border)] pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Registering Blood Bank Facility...
                  </>
                ) : (
                  <>
                    <span>Submit Blood Bank Registration</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Already registered your facility?{" "}
          <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Log in to portal
          </Link>
        </p>
      </div>
    </div>
  );
}