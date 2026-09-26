// src/pages/bloodbank/BankDashboard.jsx
//
// The blood bank's home base once logged in — distinct from the public
// homepage a normal visitor sees. Covers the two most core bank actions:
// managing inventory and responding to incoming requests.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Droplet,
  Siren,
  Plus,
  CheckCircle2,
  Loader2,
  MapPin,
  Boxes,
} from "lucide-react";
import { fetchMyBloodBankProfile } from "../../services/bloodBankService";
import { getMyInventory, addInventoryBatch } from "../../services/inventoryService";
import { getBankIncomingRequests, updateRequestStatus } from "../../services/requestService";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Alert } from "../../components/ui/alert";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BankDashboard() {
  const [profile, setProfile] = useState(null);
  const [batches, setBatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    bloodGroup: "",
    quantityUnits: "",
    collectionDate: "",
    expiryDate: "",
  });
  const [addingBatch, setAddingBatch] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function loadAll() {
    setLoading(true);
    setActionError("");
    try {
      const [profileData, inventoryData, requestsData] = await Promise.all([
        fetchMyBloodBankProfile(),
        getMyInventory(),
        getBankIncomingRequests("pending"),
      ]);
      setProfile(profileData.bloodBank);
      setBatches(inventoryData.batches || []);
      setRequests(requestsData.requests || []);
    } catch {
      setActionError("Failed to load blood bank dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddBatch(e) {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");
    if (!batchForm.bloodGroup) {
      setActionError("Please select a blood group.");
      return;
    }
    if (!batchForm.quantityUnits || Number(batchForm.quantityUnits) <= 0) {
      setActionError("Please specify a valid quantity of units.");
      return;
    }

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
      setActionSuccess("New blood batch registered successfully.");
      const inventoryData = await getMyInventory();
      setBatches(inventoryData.batches || []);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to record inventory batch.");
    } finally {
      setAddingBatch(false);
    }
  }

  async function handleRequestAction(requestId, status) {
    setActionError("");
    setActionSuccess("");
    setActionLoadingId(requestId);
    try {
      await updateRequestStatus(requestId, status);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setActionSuccess(
        status === "fulfilled"
          ? "Request fulfilled and units deducted via FEFO."
          : `Request marked as ${status}.`
      );
      if (status === "fulfilled") {
        // Refresh inventory to reflect FEFO deduction
        const inventoryData = await getMyInventory();
        setBatches(inventoryData.batches || []);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to mark request as ${status}.`);
    } finally {
      setActionLoadingId(null);
    }
  }

  // Derived metrics
  const totalStockUnits = batches.reduce((sum, b) => sum + (Number(b.quantity_units) || 0), 0);
  const activeGroupsCount = new Set(batches.filter((b) => b.quantity_units > 0).map((b) => b.blood_group)).size;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-8 w-64 animate-pulse rounded-md bg-[var(--muted)]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* HEADER BAR */}
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
                {profile?.bank_name}
              </h1>
              {profile?.is_verified_by_admin ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800"
                >
                  <ShieldCheck size={13} className="text-emerald-600" />
                  Verified Facility
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800"
                >
                  <ShieldAlert size={13} className="text-amber-600" />
                  Pending Admin Verification
                </Badge>
              )}
            </div>

            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)] sm:text-sm">
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-[var(--primary)]" />
                {profile?.city}
                {profile?.district ? `, ${profile.district}` : ""}
              </span>
              <span>·</span>
              <span className="font-[var(--font-mono)]">License: {profile?.license_number}</span>
            </p>
          </div>

          <Button
            onClick={() => setShowAddBatch((s) => !s)}
            className="gap-2 shadow-xs shrink-0 self-start sm:self-center"
          >
            <Plus size={16} />
            <span>{showAddBatch ? "Close Form" : "Add Blood Batch"}</span>
          </Button>
        </div>

        {/* FEEDBACK BANNERS */}
        {actionError && <Alert variant="destructive">{actionError}</Alert>}
        {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Available Inventory
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--primary)]">
                <Droplet size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-[var(--font-mono)] text-3xl font-extrabold text-[var(--primary)]">
                {totalStockUnits}
              </span>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">units across all groups</span>
            </div>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Pending Requisitions
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/60">
                <Siren size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-[var(--font-mono)] text-3xl font-extrabold text-[var(--foreground)]">
                {requests.length}
              </span>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">awaiting fulfillment</span>
            </div>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Active Blood Groups
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <Boxes size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-[var(--font-mono)] text-3xl font-extrabold text-[var(--foreground)]">
                {activeGroupsCount}
              </span>
              <span className="text-xs font-medium text-[var(--muted-foreground)]">of 8 groups stocked</span>
            </div>
          </Card>
        </div>

        {/* ADD BATCH MODAL/ACCORDION FORM */}
        <AnimatePresence>
          {showAddBatch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-[var(--primary)]/30 bg-[var(--card)] p-5 sm:p-7 shadow-sm">
                <div className="border-b border-[var(--border)] pb-3 mb-5">
                  <h3 className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)]">
                    Register New Blood Batch
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Batches are tracked with individual expiry dates for FEFO (First-Expired-First-Out) allocation.
                  </p>
                </div>

                <form onSubmit={handleAddBatch} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                        Blood Group <span className="text-[var(--destructive)]">*</span>
                      </label>
                      <select
                        required
                        value={batchForm.bloodGroup}
                        onChange={(e) => setBatchForm({ ...batchForm, bloodGroup: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-[var(--input)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                      >
                        <option value="" disabled>Select group…</option>
                        {BLOOD_GROUPS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                        Quantity (Units) <span className="text-[var(--destructive)]">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 5"
                        value={batchForm.quantityUnits}
                        onChange={(e) => setBatchForm({ ...batchForm, quantityUnits: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                        Collection Date
                      </label>
                      <Input
                        type="date"
                        value={batchForm.collectionDate}
                        onChange={(e) => setBatchForm({ ...batchForm, collectionDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
                        Expiry Date
                      </label>
                      <Input
                        type="date"
                        value={batchForm.expiryDate}
                        onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddBatch(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addingBatch} size="sm" className="gap-2">
                      {addingBatch ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving Batch...
                        </>
                      ) : (
                        "Save Batch to Inventory"
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECTION 1: INCOMING REQUESTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
                Incoming Requisitions
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Requests assigned to your facility by hospital staff or patients.
              </p>
            </div>
            <Badge variant="outline" className="font-[var(--font-mono)]">
              {requests.length} Pending
            </Badge>
          </div>

          {requests.length === 0 ? (
            <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-8 text-center sm:p-10">
              <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
              <h3 className="mt-3 font-[var(--font-display)] text-sm font-semibold text-[var(--foreground)]">
                All requests caught up
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                There are no pending requisitions awaiting your action right now.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => {
                const isEmergency = r.urgency === "emergency";
                const isUrgent = r.urgency === "urgent";
                const isWorking = actionLoadingId === r.id;

                return (
                  <Card
                    key={r.id}
                    className={`border p-4 transition-all hover:shadow-xs sm:p-5 ${
                      isEmergency
                        ? "border-[var(--destructive)]/40 bg-[var(--color-urgent-subtle)]"
                        : "border-[var(--border)] bg-[var(--card)]"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-[var(--font-mono)] text-xl font-extrabold text-[var(--primary)]">
                            {r.blood_group}
                          </span>
                          <span className="font-[var(--font-mono)] text-sm font-bold text-[var(--foreground)]">
                            · {r.units_needed} {Number(r.units_needed) === 1 ? "unit" : "units"}
                          </span>

                          {isEmergency ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 gap-1 text-[11px]">
                              <Siren size={12} /> Emergency Priority
                            </Badge>
                          ) : isUrgent ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px]">
                              Urgent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px]">
                              Normal
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-[var(--muted-foreground)]">
                          Requested by <strong className="text-[var(--foreground)]">{r.requester_name}</strong>
                          {r.requester_phone ? ` (${r.requester_phone})` : " · No phone provided"}
                        </p>

                        {r.notes && (
                          <p className="text-xs italic text-[var(--muted-foreground)] bg-slate-50 p-2 rounded-lg border border-[var(--border)] max-w-xl">
                            &quot;{r.notes}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleRequestAction(r.id, "accepted")}
                          className="text-xs"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleRequestAction(r.id, "fulfilled")}
                          className="gap-1.5 text-xs shadow-xs"
                        >
                          {isWorking ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Fulfill (FEFO)
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isWorking}
                          onClick={() => handleRequestAction(r.id, "rejected")}
                          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: BATCH INVENTORY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
                Blood Inventory Batches
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Live batch balances sorted by blood group and expiration schedule.
              </p>
            </div>
            <Badge variant="outline" className="font-[var(--font-mono)]">
              {batches.length} Batches Recorded
            </Badge>
          </div>

          <Card className="border-[var(--border)] bg-white overflow-hidden shadow-xs">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--color-paper)] text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-5 py-3.5">Blood Group</th>
                    <th className="px-5 py-3.5">Available Units</th>
                    <th className="px-5 py-3.5">Collection Date</th>
                    <th className="px-5 py-3.5">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                        No inventory batches registered yet. Click &quot;Add Blood Batch&quot; above to initialize stock.
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-[var(--font-mono)] font-bold text-sm text-[var(--primary)]">
                          {b.blood_group}
                        </td>
                        <td className="px-5 py-3.5 font-[var(--font-mono)] font-bold text-sm text-[var(--foreground)]">
                          {b.quantity_units}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                          {b.collection_date?.split("T")[0] || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-[var(--muted-foreground)]">
                          {b.expiry_date?.split("T")[0] || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block sm:hidden divide-y divide-[var(--border)]">
              {batches.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--muted-foreground)]">
                  No inventory batches registered yet.
                </div>
              ) : (
                batches.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-[var(--font-mono)] text-base font-bold text-[var(--primary)]">
                        {b.blood_group}
                      </span>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                        Exp: {b.expiry_date?.split("T")[0] || "No date recorded"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-[var(--font-mono)] text-lg font-bold text-[var(--foreground)]">
                        {b.quantity_units}
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)] ml-1">units</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}