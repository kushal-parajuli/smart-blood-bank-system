// src/pages/user/MyDonationsTab.jsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Ticket,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { getMyDonations } from "../../services/donationService";
import { getMyAppointments, cancelAppointment } from "../../services/appointmentService";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";

export default function MyDonationsTab() {
  const [donations, setDonations] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [donationData, appointmentData] = await Promise.all([
        getMyDonations(),
        getMyAppointments(),
      ]);
      setDonations(donationData.donations || []);
      setEligibility(donationData.eligibility || null);
      setAppointments(appointmentData.appointments || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError("Failed to load your donation history.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancelAppointment(id) {
    setCancellingId(id);
    try {
      await cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setCancellingId(null);
    }
  }

  const pendingAppointment = appointments.find((a) => a.status === "pending");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-[var(--card)] border border-[var(--border)]" />
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--card)] border border-[var(--border)]" />
      </div>
    );
  }

  // Not a donor profile yet
  if (donations === null) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)] p-6 sm:p-10 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]">
          <HeartHandshake size={28} />
        </div>
        <h2 className="mt-4 font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
          You are not registered as a donor yet
        </h2>
        <p className="mx-auto mt-1 max-w-md text-xs text-[var(--muted-foreground)]">
          Register your blood group once to schedule donations, record your lifetime impact, and receive critical shortage alerts.
        </p>
        <Button asChild size="sm" className="mt-5 gap-2">
          <Link to="/donor/register">
            Register as a Donor
            <ArrowRight size={14} />
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
          Donation Records &amp; Schedule
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Manage upcoming appointments and review your validated donation milestones.
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* UPCOMING APPOINTMENT TICKET */}
      {pendingAppointment ? (
        <Card className="border-2 border-[var(--primary)]/30 bg-[var(--secondary)]/25 p-5 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] gap-1">
                <Ticket size={11} /> Scheduled Appointment
              </Badge>
              <h3 className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)] mt-1">
                Token: <span className="font-[var(--font-mono)] text-[var(--primary)]">{pendingAppointment.token_number}</span>
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                <Calendar size={13} />
                {new Date(pendingAppointment.appointment_time).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={cancellingId === pendingAppointment.id}
              onClick={() => handleCancelAppointment(pendingAppointment.id)}
              className="text-xs text-[var(--destructive)] border-[var(--destructive)]/30 hover:bg-rose-50 self-start sm:self-center"
            >
              {cancellingId === pendingAppointment.id ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Cancelling...
                </>
              ) : (
                "Cancel Appointment"
              )}
            </Button>
          </div>
        </Card>
      ) : (
        /* ELIGIBILITY STATUS CARD */
        eligibility && (
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
            {eligibility.isEligibleNow ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-emerald-400">
                      Eligible to Donate Blood Today
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      90 days have elapsed since your last successful whole-blood donation.
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" className="gap-1.5 shrink-0 self-start sm:self-center">
                  <Link to="/donate">
                    Book Donation
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/60">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-amber-300">
                    Next Donation Window: {eligibility.nextEligibleDate}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {eligibility.note || "To safeguard donor iron levels, a mandatory 90-day recovery interval is enforced."}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )
      )}

      {/* DONATION HISTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-[var(--font-display)] text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Completed Donation History ({donations.length})
          </h3>
        </div>

        {donations.length === 0 ? (
          <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-6 text-center text-xs text-[var(--muted-foreground)]">
            No completed donations recorded yet. Once verified by hospital staff, each donation will appear here.
          </Card>
        ) : (
          <Card className="border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--color-surface-subtle)] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Blood Bank / Center</th>
                    <th className="px-5 py-3">Group</th>
                    <th className="px-5 py-3">Volume (Units)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {donations.map((d) => (
                    <tr key={d.id} className="hover:bg-[var(--color-surface-subtle)]/60 transition">
                      <td className="px-5 py-3 font-[var(--font-mono)] text-[var(--foreground)]">
                        {new Date(d.donation_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                        {d.bank_name}
                      </td>
                      <td className="px-5 py-3 font-[var(--font-mono)] font-bold text-[var(--primary)]">
                        {d.blood_group}
                      </td>
                      <td className="px-5 py-3 font-[var(--font-mono)] text-[var(--foreground)]">
                        {d.units_donated} unit
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}