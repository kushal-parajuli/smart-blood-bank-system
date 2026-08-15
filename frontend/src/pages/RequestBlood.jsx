// src/pages/RequestBlood.jsx
//
// Two-step flow, matching the project's design decision that a request
// can be created unassigned and matched to a bank afterward:
//   1. Submit the request details (blood group, units, urgency)
//   2. See banks that currently have that group in stock, pick one —
//      or skip, leaving it unassigned for now.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { createRequest, assignBank } from "../services/requestService";
import { searchAvailability } from "../services/inventoryService";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_LEVELS = [
  { value: "normal", label: "Normal" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

export default function RequestBlood() {
  const location = useLocation();
  // Set when arriving from "Request this" on the Search page — if
  // present, the bank is already chosen, so the intermediate
  // "pick a bank" step is skipped entirely.
  const preset = location.state || null;

  const [step, setStep] = useState("form"); // 'form' | 'assign' | 'done'
  const [createdRequest, setCreatedRequest] = useState(null);
  const [bankResults, setBankResults] = useState([]);
  const [assignedBankName, setAssignedBankName] = useState(null);
  const [serverError, setServerError] = useState("");
  const [assigning, setAssigning] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { unitsNeeded: 1, urgency: "normal" },
  });

  async function onSubmit(formData) {
    setServerError("");
    // When a bank was preset from Search, the blood group is shown as
    // static text rather than a real form field (see render below) — so
    // it's taken from `preset` directly here, not from formData.
    const bloodGroup = preset?.presetBloodGroup || formData.bloodGroup;

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
      setBankResults(availability.results);
      setStep("assign");
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  }

  async function handleSelectBank(bank) {
    setAssigning(true);
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

  if (step === "done") {
    return (
      <section className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Request submitted
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-slate)]">
          {assignedBankName
            ? <>Your request has been sent to <span className="font-semibold text-[var(--color-ink)]">{assignedBankName}</span>. You'll be notified when they respond.</>
            : "Your request is saved without a specific bank for now. You can come back and assign one anytime."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </section>
    );
  }

  if (step === "assign") {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          Choose a blood bank
        </h1>
        <p className="mt-1 text-sm text-[var(--color-slate)]">
          These banks currently have {createdRequest.bloodGroup} in stock. Pick one, or skip for now.
        </p>

        {serverError && <p className="mt-4 text-sm text-[var(--color-urgent)]">{serverError}</p>}

        <div className="mt-6 space-y-3">
          {bankResults.length === 0 && (
            <p className="rounded-xl border border-[var(--color-mist)] bg-white p-5 text-sm text-[var(--color-slate)]">
              No bank currently has {createdRequest.bloodGroup} in stock. That's okay — your request is
              already saved, and you can assign a bank later once stock becomes available.
            </p>
          )}

          {bankResults.map((bank) => (
            <div
              key={bank.blood_bank_id}
              className="flex items-center justify-between rounded-xl border border-[var(--color-mist)] bg-white p-5"
            >
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{bank.bank_name}</p>
                <p className="mt-1 text-sm text-[var(--color-slate)]">
                  {bank.city}{bank.district ? `, ${bank.district}` : ""} · {bank.total_units} units available
                </p>
              </div>
              <button
                onClick={() => handleSelectBank(bank)}
                disabled={assigning}
                className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Select
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={skipAssignment}
          className="mt-6 text-sm font-medium text-[var(--color-slate)] underline"
        >
          Skip — submit without assigning a bank
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
        Request blood
      </h1>
      <p className="mt-1 text-sm text-[var(--color-slate)]">
        Submit a request — for yourself or someone else.
      </p>

      {preset?.presetBankId && (
        <div className="mt-4 rounded-lg bg-[var(--color-brand-light)] px-4 py-3 text-sm text-[var(--color-brand-dark)]">
          Requesting <span className="font-semibold">{preset.presetBloodGroup}</span> directly from{" "}
          <span className="font-semibold">{preset.presetBankName}</span>.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Blood group</label>
          {preset?.presetBloodGroup ? (
            <div className="w-full rounded-lg border border-[var(--color-mist)] bg-[var(--color-paper)] px-4 py-2.5 text-sm text-[var(--color-ink)]">
              {preset.presetBloodGroup}
            </div>
          ) : (
            <>
              <select
                {...register("bloodGroup", { required: "Please select a blood group." })}
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
            </>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Units needed</label>
          <input
            type="number"
            min={1}
            {...register("unitsNeeded", { required: true, min: 1, valueAsNumber: true })}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Urgency</label>
          <select
            {...register("urgency")}
            className="w-full rounded-lg border border-[var(--color-mist)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          >
            {URGENCY_LEVELS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            Notes <span className="text-[var(--color-slate)] font-normal">(optional)</span>
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
            placeholder="Anything the blood bank should know"
          />
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
          {isSubmitting ? "Submitting…" : "Continue"}
        </button>
      </form>
    </section>
  );
}