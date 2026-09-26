// src/pages/user/MyRequestsTab.jsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Siren,
  Building2,
  Calendar,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { getMyRequests, cancelRequest } from "../../services/requestService";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";

const STATUS_BADGES = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  accepted: "bg-teal-50 text-teal-800 border-teal-200",
  fulfilled: "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function MyRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getMyRequests();
      setRequests(data.requests || []);
    } catch {
      setError("Failed to load your requisition history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await cancelRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel request.");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--card)] border border-[var(--border)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
            My Blood Requisitions
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Track current and past blood requests submitted for yourself or family members.
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5 shadow-xs shrink-0 self-start sm:self-center">
          <Link to="/request">
            <Plus size={15} />
            <span>New Request</span>
          </Link>
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {requests.length === 0 ? (
        <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)]">
            <FileText size={22} />
          </div>
          <h3 className="mt-3 font-[var(--font-display)] text-base font-semibold text-[var(--foreground)]">
            No blood requests logged
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            You haven&apos;t posted any emergency or scheduled blood requests yet.
          </p>
          <Button asChild size="sm" className="mt-5 gap-1.5">
            <Link to="/request">
              Submit Blood Request
              <ArrowRight size={14} />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const isPending = r.status === "pending";
            const isCancelling = cancellingId === r.id;
            return (
              <Card
                key={r.id}
                className="border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 transition-all hover:border-[var(--color-brand)]/40 shadow-xs"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-[var(--font-mono)] text-xl font-extrabold text-[var(--primary)]">
                        {r.blood_group}
                      </span>
                      <span className="font-[var(--font-mono)] text-sm font-semibold text-[var(--foreground)]">
                        · {r.units_needed} {Number(r.units_needed) === 1 ? "unit" : "units"}
                      </span>

                      {r.urgency === "emergency" && (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] gap-1">
                          <Siren size={11} /> Emergency
                        </Badge>
                      )}
                      {r.urgency === "urgent" && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                          Urgent
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold capitalize ${STATUS_BADGES[r.status] || ""}`}
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="text-[var(--primary)]" />
                        {r.bank_name || "Unassigned open request"}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCancelling}
                        onClick={() => handleCancel(r.id)}
                        className="text-xs text-[var(--destructive)] border-[var(--destructive)]/30 hover:bg-rose-50"
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Cancelling...
                          </>
                        ) : (
                          "Cancel Request"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}