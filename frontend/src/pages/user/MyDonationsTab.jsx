// src/pages/user/MyDonationsTab.jsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyDonations } from "../../services/donationService";
import { getMyAppointments, cancelAppointment } from "../../services/appointmentService";

export default function MyDonationsTab() {
  const [donations, setDonations] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [donationData, appointmentData] = await Promise.all([
        getMyDonations(),
        getMyAppointments(),
      ]);
      setDonations(donationData.donations);
      setEligibility(donationData.eligibility);
      setAppointments(appointmentData.appointments);
    } catch (err) {
      // 404 here just means "no donor profile yet" — not a real error to alarm over.
      if (err.response?.status !== 404) setError("Failed to load your donation history.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelAppointment(id) {
    try {
      await cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    }
  }

  const pendingAppointment = appointments.find((a) => a.status === "pending");

  if (loading) return <p className="text-sm text-[var(--color-slate)]">Loading…</p>;

  if (donations === null) {
    return (
      <div>
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">My donations</h2>
        <p className="mt-3 text-sm text-[var(--color-slate)]">You're not registered as a donor yet.</p>
        <Link to="/donor/register" className="mt-4 inline-block rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white">
          Become a donor
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">My donations</h2>
      {error && <p className="mt-2 text-sm text-[var(--color-urgent)]">{error}</p>}

      {/* Upcoming appointment */}
      {pendingAppointment ? (
        <div className="mt-4 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand-light)] p-4">
          <p className="text-sm font-semibold text-[var(--color-brand-dark)]">Upcoming appointment</p>
          <p className="mt-1 text-sm text-[var(--color-ink)]">
            {new Date(pendingAppointment.appointment_time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            {" · "}Token {pendingAppointment.token_number}
          </p>
          <button
            onClick={() => handleCancelAppointment(pendingAppointment.id)}
            className="mt-2 text-xs font-medium text-[var(--color-urgent-dark)] underline"
          >
            Cancel appointment
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[var(--color-mist)] bg-white p-4">
          {eligibility.isEligibleNow ? (
            <>
              <p className="text-sm text-[var(--color-ink)]">You're eligible to donate right now.</p>
              <Link to="/donate" className="mt-2 inline-block rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white">
                Book a donation
              </Link>
            </>
          ) : (
            <p className="text-sm text-[var(--color-slate)]">
              You'll be eligible to donate again starting <span className="font-semibold text-[var(--color-ink)]">{eligibility.nextEligibleDate}</span>.
              {" "}{eligibility.note}
            </p>
          )}
        </div>
      )}

      {/* History */}
      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-[var(--color-slate)]">
        History ({donations.length})
      </h3>
      {donations.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-slate)]">No completed donations yet.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-[var(--color-mist)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Units</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-t border-[var(--color-mist)]">
                  <td className="px-4 py-3">{new Date(d.donation_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{d.bank_name}</td>
                  <td className="px-4 py-3 font-medium">{d.blood_group}</td>
                  <td className="px-4 py-3 font-[var(--font-mono)]">{d.units_donated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}