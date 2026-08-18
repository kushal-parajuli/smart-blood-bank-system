// src/pages/user/MyRequestsTab.jsx

import { useState, useEffect } from "react";
import { getMyRequests, cancelRequest } from "../../services/requestService";

const STATUS_STYLES = {
  pending: "bg-[var(--color-mist)] text-[var(--color-slate)]",
  accepted: "bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]",
  fulfilled: "bg-[var(--color-brand)] text-white",
  rejected: "bg-[var(--color-urgent)]/10 text-[var(--color-urgent-dark)]",
  cancelled: "bg-[var(--color-mist)] text-[var(--color-slate)]",
};

export default function MyRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getMyRequests();
      setRequests(data.requests);
    } catch {
      setError("Failed to load your requests.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    try {
      await cancelRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel request.");
    }
  }

  if (loading) return <p className="text-sm text-[var(--color-slate)]">Loading…</p>;

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">My requests</h2>

      {error && <p className="mt-2 text-sm text-[var(--color-urgent)]">{error}</p>}

      {requests.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--color-slate)]">You haven't submitted any blood requests yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-mist)] bg-white p-4">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">
                  {r.blood_group} · {r.units_needed} unit(s)
                  {r.urgency !== "normal" && (
                    <span className="ml-2 rounded-full bg-[var(--color-urgent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-urgent-dark)]">
                      {r.urgency}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-[var(--color-slate)]">
                  {r.bank_name || "No bank assigned yet"} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status]}`}>
                  {r.status}
                </span>
                {r.status === "pending" && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="rounded-full border border-[var(--color-mist)] px-3 py-1 text-xs font-medium text-[var(--color-slate)] hover:border-[var(--color-urgent)] hover:text-[var(--color-urgent)]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}