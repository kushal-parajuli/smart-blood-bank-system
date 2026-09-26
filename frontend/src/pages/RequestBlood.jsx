// src/pages/RequestBlood.jsx
// Healthcare blood requisition workflow styled in supportive clinical dark theme.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import {
  Siren,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";
import { createRequest, assignBank } from "../services/requestService";
import { searchAvailability } from "../services/inventoryService";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Alert } from "../components/ui/alert";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_CONFIG = [
  {
    value: "normal",
    label: "Normal",
    desc: "Scheduled surgery or routine transfusion",
    icon: Clock,
    borderClass: "border-[var(--border)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--color-brand-subtle)]",
    badgeClass: "bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)] border border-[var(--color-brand-border)]",
  },
  {
    value: "urgent",
    label: "Urgent",
    desc: "Needed within 12–24 hours",
    icon: AlertTriangle,
    borderClass: "border-[var(--border)] peer-checked:border-amber-500 peer-checked:bg-amber-950/40",
    badgeClass: "bg-amber-950/50 text-amber-300 border border-amber-800/60",
  },
  {
    value: "emergency",
    label: "Emergency",
    desc: "Immediate life-critical requirement",
    icon: Siren,
    borderClass: "border-[var(--border)] peer-checked:border-[var(--destructive)] peer-checked:bg-[var(--color-urgent-subtle)]",
    badgeClass: "bg-rose-950/50 text-rose-300 border border-rose-800/60",
  },
];

export default function RequestBlood() {
  const location = useLocation();

  const preset = location.state || null;

  const [step, setStep] = useState("form"); // 'form' | 'assign' | 'done'
  const [createdRequest, setCreatedRequest] = useState(null);
  const [bankResults, setBankResults] = useState([]);
  const [assignedBankName, setAssignedBankName] = useState(null);
  const [serverError, setServerError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(preset?.presetBloodGroup || "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      unitsNeeded: 1,
      urgency: "normal",
      notes: "",
      bloodGroup: preset?.presetBloodGroup || "",
    },
  });

  const unitsNeeded = watch("unitsNeeded") || 1;
  const currentUrgency = watch("urgency") || "normal";

  function handleGroupSelect(group) {
    if (preset?.presetBloodGroup) return;
    setSelectedGroup(group);
    setValue("bloodGroup", group, { shouldValidate: true });
  }

  function handleUnitChange(delta) {
    const next = Math.max(1, Math.min(20, Number(unitsNeeded) + delta));
    setValue("unitsNeeded", next);
  }

  async function onSubmit(formData) {
    setServerError("");
    const bloodGroup = preset?.presetBloodGroup || selectedGroup || formData.bloodGroup;

    if (!bloodGroup) {
      setServerError("Please select a valid blood group.");
      return;
    }

    try {
      const data = await createRequest({ ...formData, bloodGroup });
      setCreatedRequest(data.request);

      if (preset?.presetBankId) {
        await assignBank(data.request.id, preset.presetBankId);
        setAssignedBankName(preset.presetBankName);
        setStep("done");
        return;
      }

      const availability = await searchAvailability({ bloodGroup });
      setBankResults(availability.results || []);
      setStep("assign");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  async function handleSelectBank(bank) {
    setAssigning(true);
    setServerError("");
    try {
      await assignBank(createdRequest.id, bank.blood_bank_id);
      setAssignedBankName(bank.bank_name);
      setStep("done");
    } catch (err) {
      setServerError(err.response?.data?.message || "Couldn't assign this bank. Please try another.");
    } finally {
      setAssigning(false);
    }
  }

  function skipAssignment() {
    setStep("done");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* PROGRESS STEPPER HEADER */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-red-900/60 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-400 shadow-sm"
            >
              <Siren size={13} className="text-red-400" />
              Patient &amp; Hospital Request Protocol
            </Badge>
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
            {step === "form" && "Request Blood Supply"}
            {step === "assign" && "Select Fulfilling Blood Bank"}
            {step === "done" && "Request Submitted Successfully"}
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            {step === "form" &&
              "Submit clinical blood requirements. Requests can be linked directly to a blood bank or broadcasted for automated donor and inventory matching."}
            {step === "assign" &&
              "Verified blood banks with available stock have been matched to your requirement. Choose a facility to route fulfillment."}
            {step === "done" &&
              "Your requisition is recorded in the centralized dispatch ledger. Track status and responses in real-time."}
          </p>

          {/* Stepper Progress Bar */}
          <div className="flex items-center gap-2 pt-2 text-xs font-semibold">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                step === "form"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]"
              }`}
            >
              <span>1. Request Details</span>
            </div>

            <ChevronRight size={14} className="text-[var(--muted-foreground)]" />

            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                step === "assign"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : step === "done"
                  ? "bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]"
                  : "bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)] border border-[var(--border)]"
              }`}
            >
              <span>2. Bank Allocation</span>
            </div>

            <ChevronRight size={14} className="text-[var(--muted-foreground)]" />

            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                step === "done"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)] border border-[var(--border)]"
              }`}
            >
              <span>3. Dispatch Confirmation</span>
            </div>
          </div>
        </div>

        {/* SERVER ERROR ALERT */}
        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        {/* STEP 1: FORM */}
        {step === "form" && (
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-lg sm:p-8">
            {/* PRESET BANNER */}
            {preset?.presetBankId && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] p-4 text-sm text-[var(--foreground)]">
                <Building2 size={20} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                <div>
                  <p className="font-semibold text-white">Pre-selected Target Facility</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    Requesting <strong className="font-mono text-[var(--primary)]">{preset.presetBloodGroup}</strong> directly from{" "}
                    <strong className="text-white">{preset.presetBankName}</strong>. Step 2 will be automatically linked upon submission.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
              {/* BLOOD GROUP SELECTION */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Blood Group Required <span className="text-[var(--destructive)]">*</span>
                  </label>
                  {(selectedGroup || preset?.presetBloodGroup) && (
                    <span className="font-mono text-xs font-bold text-[var(--primary)]">
                      Selected: {preset?.presetBloodGroup || selectedGroup}
                    </span>
                  )}
                </div>

                {preset?.presetBloodGroup ? (
                  <div className="flex items-center justify-between rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
                    <span className="font-mono text-lg font-extrabold text-[var(--primary)]">
                      {preset.presetBloodGroup}
                    </span>
                    <Badge variant="outline" className="border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--primary)] text-xs">
                      Locked from Search
                    </Badge>
                  </div>
                ) : (
                  <>
                    <input
                      type="hidden"
                      {...register("bloodGroup", { required: "Please select a blood group." })}
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
                            className={`flex h-12 flex-col items-center justify-center rounded-xl border text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer ${
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-teal-900/40 scale-[1.03]"
                                : "border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--foreground)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-surface-elevated)]"
                            }`}
                          >
                            <span className="font-mono text-base">{group}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.bloodGroup && (
                      <p className="mt-1.5 text-xs font-medium text-[var(--destructive)]">
                        {errors.bloodGroup.message}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* UNITS NEEDED WITH STEPPER */}
              <div className="border-t border-[var(--border)] pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Units Needed (Bags) <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <span className="text-xs text-[var(--muted-foreground)]">Standard bag: ~450 mL</span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Stepper Control */}
                  <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] p-1">
                    <button
                      type="button"
                      onClick={() => handleUnitChange(-1)}
                      disabled={Number(unitsNeeded) <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--color-surface-elevated)] disabled:opacity-30 cursor-pointer"
                    >
                      –
                    </button>
                    <span className="w-16 text-center font-mono text-xl font-extrabold text-[var(--primary)]">
                      {unitsNeeded}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnitChange(1)}
                      disabled={Number(unitsNeeded) >= 20}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--color-surface-elevated)] disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Select Presets */}
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setValue("unitsNeeded", num)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                          Number(unitsNeeded) === num
                            ? "bg-[var(--primary)] text-white font-bold shadow-sm"
                            : "border border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--color-brand)]/50"
                        }`}
                      >
                        {num} {num === 1 ? "unit" : "units"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* URGENCY LEVEL SELECTOR */}
              <div className="border-t border-[var(--border)] pt-6">
                <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Clinical Urgency Level <span className="text-[var(--destructive)]">*</span>
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {URGENCY_CONFIG.map((u) => {
                    const Icon = u.icon;
                    const isSelected = currentUrgency === u.value;
                    return (
                      <label
                        key={u.value}
                        className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${
                          isSelected
                            ? u.value === "emergency"
                              ? "border-[var(--destructive)] bg-[var(--color-urgent-subtle)] shadow-sm"
                              : u.value === "urgent"
                              ? "border-amber-500 bg-amber-950/40 shadow-sm"
                              : "border-[var(--primary)] bg-[var(--color-brand-subtle)] shadow-sm"
                            : "border-[var(--border)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-elevated)]"
                        }`}
                      >
                        <input
                          type="radio"
                          value={u.value}
                          {...register("urgency")}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              u.value === "emergency"
                                ? "bg-red-950 text-red-400 border border-red-800/60"
                                : u.value === "urgent"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                : "bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              u.value === "emergency"
                                ? "bg-red-950 text-red-300 border border-red-800/60"
                                : u.value === "urgent"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                : "bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]"
                            }`}
                          >
                            {u.label}
                          </span>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-[var(--muted-foreground)]">{u.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* CLINICAL NOTES */}
              <div className="border-t border-[var(--border)] pt-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Clinical / Hospital Notes <span className="font-normal lowercase text-[var(--muted-foreground)]">(optional)</span>
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="Specify patient location, hospital ward, contact person, or specific transfusion instructions..."
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="border-t border-[var(--border)] pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || (!preset?.presetBloodGroup && !selectedGroup)}
                  size="lg"
                  className="w-full gap-2 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Recording Request...
                    </>
                  ) : (
                    <>
                      <span>{preset?.presetBankId ? "Confirm & Route to Bank" : "Proceed to Bank Allocation"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 2: ASSIGN BLOOD BANK */}
        {step === "assign" && (
          <div className="space-y-6">
            <Card className="border-[var(--border)] bg-[var(--card)] p-5 sm:p-7 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-[var(--foreground)]">
                    Available Matches for {createdRequest?.bloodGroup}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Select a facility to route this request immediately.
                  </p>
                </div>
                <Badge variant="outline" className="border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] text-[var(--primary)]">
                  Requested: {createdRequest?.unitsNeeded} units
                </Badge>
              </div>

              {bankResults.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-950/40 text-amber-400 border border-amber-800/60">
                    <Info size={24} />
                  </div>
                  <h4 className="font-heading text-base font-semibold text-[var(--foreground)]">
                    No immediate inventory found
                  </h4>
                  <p className="mx-auto max-w-md text-sm text-[var(--muted-foreground)]">
                    None of the verified banks currently report active batches for{" "}
                    <strong className="text-white">{createdRequest?.bloodGroup}</strong>. Your request is already saved in the system. You
                    can skip assigning for now, and nearby banks and eligible donors can accept it as stock becomes
                    available.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {bankResults.map((bank) => (
                    <div
                      key={bank.blood_bank_id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] p-4 transition-all hover:border-[var(--color-brand)]/50 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-[var(--primary)] shrink-0" />
                          <p className="font-heading text-base font-bold text-[var(--foreground)]">
                            {bank.bank_name}
                          </p>
                          {!!bank.is_verified_by_admin && (
                            <Badge
                              variant="outline"
                              className="border-emerald-800/60 bg-emerald-950/60 text-[10px] text-emerald-400"
                            >
                              <ShieldCheck size={11} className="text-emerald-400" /> Verified
                            </Badge>
                          )}
                        </div>

                        <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <MapPin size={13} className="shrink-0 text-[var(--primary)]" />
                          {bank.city}
                          {bank.district ? `, ${bank.district}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0 sm:gap-4">
                        <div className="text-left sm:text-right">
                          <span className="font-mono text-xl font-bold text-[var(--primary)]">
                            {bank.total_units}
                          </span>{" "}
                          <span className="text-xs text-[var(--muted-foreground)]">units in stock</span>
                        </div>

                        <Button
                          onClick={() => handleSelectBank(bank)}
                          disabled={assigning}
                          size="sm"
                          className="gap-1.5 font-semibold"
                        >
                          {assigning ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <span>Assign Bank</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-4 sm:flex-row">
                <Button
                  variant="ghost"
                  onClick={skipAssignment}
                  className="text-xs text-[var(--muted-foreground)] hover:text-white"
                >
                  Skip — Submit without immediate bank assignment
                </Button>

                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Unassigned requests are visible in the donor fallback queue.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 3: CONFIRMATION / DONE */}
        {step === "done" && (
          <Card className="border-[var(--border)] bg-[var(--card)] p-6 text-center sm:p-10 shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 size={32} />
            </div>

            <h2 className="mt-4 font-heading text-2xl font-bold text-[var(--foreground)]">
              Blood Requisition Confirmed
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)] leading-relaxed">
              {assignedBankName ? (
                <>
                  Your request has been routed directly to{" "}
                  <strong className="text-white">{assignedBankName}</strong>. You will receive real-time
                  notifications on acceptance and fulfillment.
                </>
              ) : (
                "Your request has been recorded without a linked facility. You can link an available blood bank anytime from your personal dashboard."
              )}
            </p>

            {/* SUMMARY CARD */}
            <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--border)] bg-[var(--color-surface-subtle)] p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Requisition ID:</span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  REQ-{createdRequest?.id || "LOGGED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Blood Group:</span>
                <span className="font-mono font-bold text-[var(--primary)]">
                  {createdRequest?.bloodGroup}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Units:</span>
                <span className="font-mono font-bold text-[var(--foreground)]">
                  {createdRequest?.unitsNeeded}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Priority:</span>
                <span className="font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {createdRequest?.urgency}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2">
                <span className="text-[var(--muted-foreground)]">Allocated Bank:</span>
                <span className="font-medium text-[var(--foreground)]">
                  {assignedBankName || "Open / Unassigned"}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto font-semibold">
                <Link to="/dashboard">
                  View in My Requests
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}