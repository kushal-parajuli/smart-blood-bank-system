// src/pages/bloodbank/BankDashboard.jsx
//
// The blood bank's home base once logged in — distinct from the public
// homepage a normal visitor sees. Covers the two most core bank actions:
// managing inventory and responding to incoming requests. Donor
// appointment management is a natural next addition, kept separate for now.

import { useState, useEffect } from "react";
import { fetchMyBloodBankProfile } from "../../services/bloodBankService";
import { getMyInventory, addInventoryBatch } from "../../services/inventoryService";
import { getBankIncomingRequests, updateRequestStatus } from "../../services/requestService";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BankDashboard() {
  const [profile, setProfile] = useState(null);
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({ bloodGroup: "", quantityUnits: "", collectionDate: "", expiryDate: "" });
  const [addingBatch, setAddingBatch] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [profileData, inventoryData, requestsData] = await Promise.all([
        fetchMyBloodBankProfile(),
        getMyInventory(),
        getBankIncomingRequests("pending"),
      ]);
      setProfile(profileData.bloodBank);
      setBatches(inventoryData.batches);
      setRequests(requestsData.requests);
    } catch (err) {
      setActionError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBatch(e) {
    e.preventDefault();
    setActionError("");
    setAddingBatch(true);
    try {
      await addInventoryBatch({
        bloodGroup: batchForm.bloodGroup,
        quantityUnits: Number(batchForm.quantityUnits),
        collectionDate: batchForm.collectionDate || undefined,
        expiryDate: batchForm.expiryDate || undefined,
      });
      setBatchForm({ bloodGroup: "", quantityUnits: "", collectionDate: "", expiryDate: "" });
      setShowAddBatch(false);
      const inventoryData = await getMyInventory();
      setBatches(inventoryData.batches);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to add batch.");
    } finally {
      setAddingBatch(false);
    }
  }

  async function handleRequestAction(requestId, status) {
    setActionError("");
    try {
      await updateRequestStatus(requestId, status);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to mark request as ${status}.`);
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-sm text-[var(--color-slate)]">Loading dashboard…</div>;
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
            {profile?.bank_name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-slate)]">
            {profile?.city}{profile?.district ? `, ${profile.district}` : ""} · License {profile?.license_number}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            profile?.is_verified_by_admin
              ? "bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]"
              : "bg-[var(--color-urgent)]/10 text-[var(--color-urgent-dark)]"
          }`}
        >
          {profile?.is_verified_by_admin ? "Verified" : "Pending admin verification"}
        </span>
      </div>

      {actionError && (
        <p className="mt-4 rounded-lg bg-[var(--color-urgent)]/10 px-3 py-2 text-sm text-[var(--color-urgent-dark)]">
          {actionError}
        </p>
      )}

      {/* Incoming requests */}
      <div className="mt-10">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
          Incoming requests {requests.length > 0 && `(${requests.length})`}
        </h2>

        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-slate)]">No pending requests right now.</p>
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
                    Requested by {r.requester_name} · {r.requester_phone || "no phone provided"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequestAction(r.id, "accepted")}
                    className="rounded-full border border-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand)]"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRequestAction(r.id, "fulfilled")}
                    className="rounded-full bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Fulfill
                  </button>
                  <button
                    onClick={() => handleRequestAction(r.id, "rejected")}
                    className="rounded-full border border-[var(--color-mist)] px-3 py-1.5 text-xs font-medium text-[var(--color-slate)]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">Inventory</h2>
          <button
            onClick={() => setShowAddBatch((s) => !s)}
            className="rounded-full bg-[var(--color-brand)] px-4 py-1.5 text-sm font-semibold text-white"
          >
            {showAddBatch ? "Cancel" : "Add batch"}
          </button>
        </div>

        {showAddBatch && (
          <form onSubmit={handleAddBatch} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--color-mist)] bg-white p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Blood group</label>
              <select
                required
                value={batchForm.bloodGroup}
                onChange={(e) => setBatchForm({ ...batchForm, bloodGroup: e.target.value })}
                className="rounded-lg border border-[var(--color-mist)] px-3 py-2 text-sm"
              >
                <option value="" disabled>Select…</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Units</label>
              <input
                type="number"
                min={1}
                required
                value={batchForm.quantityUnits}
                onChange={(e) => setBatchForm({ ...batchForm, quantityUnits: e.target.value })}
                className="w-24 rounded-lg border border-[var(--color-mist)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Collected</label>
              <input
                type="date"
                value={batchForm.collectionDate}
                onChange={(e) => setBatchForm({ ...batchForm, collectionDate: e.target.value })}
                className="rounded-lg border border-[var(--color-mist)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Expires</label>
              <input
                type="date"
                value={batchForm.expiryDate}
                onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                className="rounded-lg border border-[var(--color-mist)] px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addingBatch}
              className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {addingBatch ? "Saving…" : "Save batch"}
            </button>
          </form>
        )}

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-mist)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-slate)]">
              <tr>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Collected</th>
                <th className="px-4 py-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[var(--color-slate)]">No inventory batches yet.</td></tr>
              )}
              {batches.map((b) => (
                <tr key={b.id} className="border-t border-[var(--color-mist)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{b.blood_group}</td>
                  <td className="px-4 py-3 font-[var(--font-mono)]">{b.quantity_units}</td>
                  <td className="px-4 py-3 text-[var(--color-slate)]">{b.collection_date?.split("T")[0] || "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-slate)]">{b.expiry_date?.split("T")[0] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}