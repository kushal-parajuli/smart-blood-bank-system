// src/pages/admin/AdminDashboard.jsx
// Production-grade administration console for system telemetry, facility verification,
// donor credentialing, and user governance.

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Building2, 
  HeartHandshake, 
  Users, 
  ShieldCheck, 
  Check, 
  Ban, 
  RotateCcw, 
  Search, 
  Droplet,
  Calendar,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  User,
  X,
  ShieldAlert,
  Clock
} from "lucide-react";
import { 
  getSystemStats, 
  getUnverifiedBloodBanks, 
  verifyBloodBank, 
  rejectBloodBank, 
  getAllDonors, 
  getAllUsers, 
  suspendUser, 
  unsuspendUser 
} from "../../services/adminService";
import PageHeader from "../../components/layout/PageHeader";
import Section from "../../components/layout/Section";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Alert } from "../../components/ui/alert";
import AdminProfileTab from "./AdminProfileTab";

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && ["overview", "banks", "donors", "users", "profile"].includes(initialTab)
      ? initialTab
      : "overview"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["overview", "banks", "donors", "users", "profile"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  
  // State for data
  const [stats, setStats] = useState(null);
  const [pendingBanks, setPendingBanks] = useState([]);
  const [rejectedBanks, setRejectedBanks] = useState([]);
  const [allDonors, setAllDonors] = useState([]);
  const [userList, setUserList] = useState([]);
  
  // Blood bank queue tab filter
  const [bankQueueFilter, setBankQueueFilter] = useState("pending"); // "pending" | "rejected"
  const [rejectModalBank, setRejectModalBank] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [donorSearchQuery, setDonorSearchQuery] = useState("");

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingBanksRes, rejectedBanksRes, donorsRes, usersRes] = await Promise.all([
        getSystemStats().catch(() => ({ stats: null })),
        getUnverifiedBloodBanks("pending").catch(() => ({ banks: [] })),
        getUnverifiedBloodBanks("rejected").catch(() => ({ banks: [] })),
        getAllDonors().catch(() => ({ donors: [] })),
        getAllUsers().catch(() => ({ users: [] })),
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (pendingBanksRes?.banks) setPendingBanks(pendingBanksRes.banks);
      if (rejectedBanksRes?.banks) setRejectedBanks(rejectedBanksRes.banks);
      if (donorsRes?.donors) setAllDonors(donorsRes.donors);
      if (usersRes?.users) setUserList(usersRes.users);
    } catch {
      setNotification({ type: "error", message: "Failed to load administration data. Please refresh." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  // Bank Verification Handler
  async function handleVerifyBank(bankId) {
    setActionLoadingId(`bank-${bankId}`);
    try {
      await verifyBloodBank(bankId);
      setPendingBanks((prev) => prev.filter((b) => b.id !== bankId));
      setRejectedBanks((prev) => prev.filter((b) => b.id !== bankId));
      setNotification({ type: "success", message: `Blood bank #${bankId} successfully verified & approved.` });
      // Refresh stats
      const statsRes = await getSystemStats();
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err) {
      setNotification({ type: "error", message: err.response?.data?.message || "Failed to verify facility." });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Bank Rejection Handler
  async function handleConfirmReject() {
    if (!rejectModalBank) return;
    const bankId = rejectModalBank.id;
    setActionLoadingId(`bank-reject-${bankId}`);
    try {
      await rejectBloodBank(bankId, rejectReason);
      const rejectedItem = { ...rejectModalBank, verification_status: "rejected", rejection_reason: rejectReason };
      setPendingBanks((prev) => prev.filter((b) => b.id !== bankId));
      setRejectedBanks((prev) => [rejectedItem, ...prev]);
      setNotification({ type: "warning", message: `Blood bank application for "${rejectModalBank.bank_name}" was rejected.` });
      setRejectModalBank(null);
      setRejectReason("");
      const statsRes = await getSystemStats();
      if (statsRes?.stats) setStats(statsRes.stats);
    } catch (err) {
      setNotification({ type: "error", message: err.response?.data?.message || "Failed to reject blood bank." });
    } finally {
      setActionLoadingId(null);
    }
  }

  // User Suspension Toggle Handler
  async function handleToggleSuspend(user) {
    const isCurrentlySuspended = user.is_suspended;
    setActionLoadingId(`user-${user.id}`);
    try {
      if (isCurrentlySuspended) {
        await unsuspendUser(user.id);
        setUserList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_suspended: 0 } : u))
        );
        setNotification({ type: "success", message: `User "${user.name}" unsuspended.` });
      } else {
        await suspendUser(user.id);
        setUserList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_suspended: 1 } : u))
        );
        setNotification({ type: "warning", message: `User "${user.name}" has been suspended.` });
      }
    } catch (err) {
      setNotification({ type: "error", message: err.response?.data?.message || "Action failed." });
    } finally {
      setActionLoadingId(null);
    }
  }

  // Filtered users
  const filteredUsers = userList.filter((u) => {
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !query || 
      u.name?.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query) || 
      u.phone?.includes(query);
    return matchesRole && matchesQuery;
  });

  // Filtered donors
  const filteredDonors = allDonors.filter((d) => {
    const query = donorSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      d.name?.toLowerCase().includes(query) || 
      d.blood_group?.toLowerCase().includes(query) || 
      d.city?.toLowerCase().includes(query) || 
      d.district?.toLowerCase().includes(query) || 
      d.phone?.includes(query) ||
      d.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-[calc(100vh-64px)] pb-16">
      
      {/* Admin Top Command Header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <Section size="wide">
          <PageHeader
            title="System Administration &amp; Telemetry"
            description="Manage clinical verification queues, view network-wide metrics, and govern access."
            badge="Super Admin Console"
            action={
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAllAdminData} 
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
              </Button>
            }
          />

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 border-b border-transparent -mb-px overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => handleTabChange("overview")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "overview"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              System Telemetry
            </button>

            <button
              onClick={() => handleTabChange("banks")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "banks"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Facility Verifications
              {pendingBanks.length > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {pendingBanks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("donors")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "donors"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Registered Donors
              {allDonors.length > 0 && (
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center">
                  {allDonors.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("users")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "users"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              User &amp; Facility Directory
            </button>

            <button
              onClick={() => handleTabChange("profile")}
              className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "profile"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <User size={15} />
              Admin Profile &amp; Security
            </button>
          </div>
        </Section>
      </div>

      {/* Main Administrative Views */}
      <Section size="wide" className="mt-8">
        
        {/* Dynamic Alerts */}
        {notification && (
          <div className="mb-6">
            <Alert 
              variant={notification.type === "error" ? "destructive" : "info"}
              className="flex items-center justify-between"
            >
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="text-xs font-semibold underline ml-4"
              >
                Dismiss
              </button>
            </Alert>
          </div>
        )}

        {/* TAB 1: SYSTEM OVERVIEW / TELEMETRY */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <Card variant="default">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Accounts
                    </span>
                    <Users size={18} className="text-teal-700" />
                  </div>
                  <p className="font-heading text-3xl font-extrabold text-slate-900 mt-2">
                    {stats?.users?.total_users || userList.length || 0}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-teal-700 font-semibold">{stats?.users?.normal_users || 0} Citizens</span>
                    <span>•</span>
                    <span className="text-blue-700 font-semibold">{stats?.users?.blood_banks || 0} Facilities</span>
                  </div>
                </CardContent>
              </Card>

              <Card variant="default">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Transfusion Facilities
                    </span>
                    <Building2 size={18} className="text-blue-700" />
                  </div>
                  <p className="font-heading text-3xl font-extrabold text-slate-900 mt-2">
                    {stats?.bloodBanks?.total_banks || 0}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-medium">
                      ✓ {stats?.bloodBanks?.verified_banks || 0} Verified
                    </span>
                    {pendingBanks.length > 0 && (
                      <span className="text-amber-700 font-semibold">
                        {pendingBanks.length} Pending
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card variant="default">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Donor Network
                    </span>
                    <HeartHandshake size={18} className="text-red-600" />
                  </div>
                  <p className="font-heading text-3xl font-extrabold text-slate-900 mt-2">
                    {stats?.donors?.total_donors || allDonors.length || 0}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-teal-700 font-medium">
                      ✓ Active Voluntary Lifesavers
                    </span>
                    <span className="text-slate-500 font-medium">
                      Direct Pledges
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card variant="default">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Units Transfused
                    </span>
                    <Droplet size={18} className="text-rose-600" />
                  </div>
                  <p className="font-heading text-3xl font-extrabold text-slate-900 mt-2">
                    {stats?.donations?.total_units_donated || 0}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                    <span>{stats?.requests?.total_requests || 0} Total Requests</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">{stats?.requests?.fulfilled_requests || 0} Fulfilled</span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Quick Action Queues Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <Card variant="default">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 text-sm">
                        Facility Applications Awaiting Approval
                      </h3>
                      <p className="text-xs text-slate-500">Require license validation</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTabChange("banks")}
                    className="text-xs"
                  >
                    View Queue ({pendingBanks.length})
                  </Button>
                </div>
                <CardContent className="p-5">
                  {pendingBanks.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2">
                      <ShieldCheck size={28} className="text-teal-700" />
                      <span>All blood bank applications are up to date and verified.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingBanks.slice(0, 3).map((bank) => (
                        <div key={bank.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{bank.bank_name}</p>
                            <p className="text-xs text-slate-500">{bank.district}, {bank.province} • Lic: {bank.license_number}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleVerifyBank(bank.id)}
                            disabled={actionLoadingId === `bank-${bank.id}`}
                            className="text-xs h-8"
                          >
                            Verify
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card variant="default">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                      <HeartHandshake size={16} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 text-sm">
                        Registered Voluntary Donors
                      </h3>
                      <p className="text-xs text-slate-500">Voluntary lifesavers network</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTabChange("donors")}
                    className="text-xs"
                  >
                    View All ({allDonors.length})
                  </Button>
                </div>
                <CardContent className="p-5">
                  {allDonors.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2">
                      <HeartHandshake size={28} className="text-teal-700" />
                      <span>No voluntary donors have registered yet.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allDonors.slice(0, 3).map((donor) => (
                        <div key={donor.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                              {donor.blood_group}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{donor.name}</p>
                              <p className="text-xs text-slate-500">{donor.city}{donor.district ? `, ${donor.district}` : ""}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[11px] text-emerald-700 border-emerald-300 bg-emerald-50">
                            Active
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        )}

        {/* TAB 2: BLOOD BANK VERIFICATION QUEUE */}
        {activeTab === "banks" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900">
                  Transfusion Facility Verification Queue
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inspect institutional credentials. Review, approve, or reject blood bank registrations.
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-lg border border-[var(--border)] shadow-xs self-start sm:self-auto">
                <button
                  onClick={() => setBankQueueFilter("pending")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    bankQueueFilter === "pending"
                      ? "bg-amber-500 text-white"
                      : "text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  Pending Review ({pendingBanks.length})
                </button>
                <button
                  onClick={() => setBankQueueFilter("rejected")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    bankQueueFilter === "rejected"
                      ? "bg-rose-600 text-white"
                      : "text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  Rejected ({rejectedBanks.length})
                </button>
              </div>
            </div>

            {bankQueueFilter === "pending" ? (
              pendingBanks.length === 0 ? (
                <Card variant="subtle" className="p-12 text-center">
                  <ShieldCheck size={40} className="mx-auto text-teal-700 mb-3" />
                  <h3 className="font-heading font-bold text-slate-900 text-base">
                    No Pending Facility Verifications
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Every registered blood bank has been reviewed. Facilities can only log in once officially verified.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingBanks.map((bank) => (
                    <Card key={bank.id} variant="default" className="p-6 hover:border-slate-300 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-heading text-lg font-bold text-slate-900">
                              {bank.bank_name}
                            </h3>
                            <Badge variant="outline" className="text-xs text-amber-800 border-amber-300 bg-amber-50">
                              Pending Admin Review
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-600 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Building2 size={13} className="text-slate-400" />
                              <strong>License:</strong> {bank.license_number}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-slate-400" />
                              {bank.city}, {bank.district}, {bank.province}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              Applied: {new Date(bank.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users size={13} className="text-slate-400" />
                              Contact: {bank.contact_name}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail size={13} className="text-slate-400" />
                              {bank.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-400" />
                              {bank.phone || "No phone provided"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                          <Button
                            onClick={() => handleVerifyBank(bank.id)}
                            disabled={actionLoadingId === `bank-${bank.id}`}
                            className="gap-1.5 font-semibold"
                          >
                            <Check size={16} /> 
                            {actionLoadingId === `bank-${bank.id}` ? "Approving…" : "Approve & Verify"}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              setRejectModalBank(bank);
                              setRejectReason("");
                            }}
                            disabled={actionLoadingId === `bank-${bank.id}`}
                            className="gap-1.5 font-semibold text-rose-700 border-rose-300 hover:bg-rose-50"
                          >
                            <Ban size={15} />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              rejectedBanks.length === 0 ? (
                <Card variant="subtle" className="p-12 text-center">
                  <ShieldCheck size={40} className="mx-auto text-slate-400 mb-3" />
                  <h3 className="font-heading font-bold text-slate-900 text-base">
                    No Rejected Facility Registrations
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    No facility registrations have been rejected.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {rejectedBanks.map((bank) => (
                    <Card key={bank.id} variant="default" className="p-6 border-rose-200/80 hover:border-rose-300 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-heading text-lg font-bold text-slate-900">
                              {bank.bank_name}
                            </h3>
                            <Badge variant="outline" className="text-xs text-rose-800 border-rose-300 bg-rose-50">
                              Registration Rejected
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-slate-600 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Building2 size={13} className="text-slate-400" />
                              <strong>License:</strong> {bank.license_number}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-slate-400" />
                              {bank.city}, {bank.district}, {bank.province}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Mail size={13} className="text-slate-400" />
                              {bank.email}
                            </span>
                          </div>

                          {bank.rejection_reason && (
                            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-900 mt-2">
                              <strong>Rejection Reason:</strong> {bank.rejection_reason}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                          <Button
                            variant="outline"
                            onClick={() => handleVerifyBank(bank.id)}
                            disabled={actionLoadingId === `bank-${bank.id}`}
                            className="gap-1.5 font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            <RotateCcw size={15} />
                            Re-approve Facility
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 3: REGISTERED DONORS DIRECTORY */}
        {activeTab === "donors" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900">
                  Voluntary Lifesaver Donors Directory
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Normal user requests to become a donor are active immediately. View network-wide voluntary lifesavers.
                </p>
              </div>
              <Badge variant="outline" className="text-teal-800 border-teal-300 bg-teal-50 self-start sm:self-auto">
                {allDonors.length} Registered Donors
              </Badge>
            </div>

            {/* Search Filter Bar */}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search donors by name, blood group, city…"
                value={donorSearchQuery}
                onChange={(e) => setDonorSearchQuery(e.target.value)}
                className="pl-9 bg-[var(--card)]"
              />
            </div>

            {filteredDonors.length === 0 ? (
              <Card variant="subtle" className="p-12 text-center">
                <HeartHandshake size={40} className="mx-auto text-teal-700 mb-3" />
                <h3 className="font-heading font-bold text-slate-900 text-base">
                  No Donors Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {donorSearchQuery ? "No donors matched your search query." : "No voluntary donors have registered yet."}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDonors.map((donor) => (
                  <Card key={donor.id} variant="default" className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded bg-red-100 text-red-900">
                          {donor.blood_group}
                        </span>
                        <Badge variant="outline" className="text-[11px] text-emerald-700 border-emerald-300 bg-emerald-50">
                          Active Donor
                        </Badge>
                      </div>

                      <h3 className="font-heading text-base font-bold text-slate-900">
                        {donor.name}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          {donor.city}{donor.district ? `, ${donor.district}` : ""}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-400" />
                          {donor.phone || "No phone listed"}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" />
                          {donor.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Joined {new Date(donor.created_at).toLocaleDateString()}</span>
                      <span className="text-emerald-700 font-medium">Ready for summons</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USER & FACILITY DIRECTORY */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900">
                  User &amp; Organization Directory
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  View account statuses, role credentials, and execute administrative suspensions.
                </p>
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1 bg-[var(--card)] p-1 rounded-lg border border-[var(--border)] shadow-sm">
                {["all", "user", "blood_bank", "admin"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRoleFilter(role)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                      userRoleFilter === role
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--muted-foreground)] hover:text-white hover:bg-[var(--color-surface-subtle)]"
                    }`}
                  >
                    {role === "all" ? "All" : role.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search user by name, email, or phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[var(--card)]"
              />
            </div>

            {/* Directory Table */}
            <Card variant="default" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[var(--muted-foreground)]">
                  <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--border)] text-[var(--foreground)] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-[var(--muted-foreground)]">
                          No users matched your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSuspended = Boolean(user.is_suspended);
                        const isLoadingThis = actionLoadingId === `user-${user.id}`;
                        return (
                          <tr key={user.id} className="hover:bg-[var(--color-surface-subtle)]/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-[var(--foreground)] text-sm">{user.name}</p>
                              <span className="text-[11px] text-[var(--muted-foreground)]">ID #{user.id}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <p>{user.email}</p>
                              <p className="text-[var(--muted-foreground)]">{user.phone || "—"}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : user.role === "blood_bank"
                                  ? "bg-teal-100 text-teal-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {user.role.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {isSuspended ? (
                                <Badge variant="destructive" className="text-[10px] py-0 px-2">
                                  Suspended
                                </Badge>
                              ) : (
                                <Badge variant="verified" className="text-[10px] py-0 px-2">
                                  Active
                                </Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {user.role !== "admin" && (
                                <Button
                                  variant={isSuspended ? "outline" : "destructive"}
                                  size="sm"
                                  onClick={() => handleToggleSuspend(user)}
                                  disabled={isLoadingThis}
                                  className="text-xs h-7"
                                >
                                  {isSuspended ? (
                                    <>
                                      <RotateCcw size={12} className="mr-1" /> Unsuspend
                                    </>
                                  ) : (
                                    <>
                                      <Ban size={12} className="mr-1" /> Suspend
                                    </>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: Administrator Profile & Credentials */}
        {activeTab === "profile" && <AdminProfileTab />}

        {/* BLOOD BANK REJECTION MODAL */}
        {rejectModalBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-xl border border-[var(--border)]">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 text-rose-600">
                  <Ban size={20} />
                  <h3 className="font-heading font-bold text-base text-[var(--foreground)]">
                    Reject Facility Application
                  </h3>
                </div>
                <button
                  onClick={() => setRejectModalBank(null)}
                  className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-[var(--muted-foreground)]">
                  You are rejecting the registration application for:
                </p>
                <div className="rounded-lg bg-[var(--color-surface-subtle)] p-3 text-xs space-y-1">
                  <p className="font-bold text-[var(--foreground)]">{rejectModalBank.bank_name}</p>
                  <p className="text-[var(--muted-foreground)]">License: {rejectModalBank.license_number}</p>
                  <p className="text-[var(--muted-foreground)]">Contact: {rejectModalBank.contact_name} ({rejectModalBank.email})</p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Rejection Reason (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., Operating license could not be verified with official registry."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    This reason will be provided to the facility upon login attempts.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalBank(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmReject}
                  disabled={actionLoadingId === `bank-reject-${rejectModalBank.id}`}
                  className="gap-1.5"
                >
                  <Ban size={14} />
                  {actionLoadingId === `bank-reject-${rejectModalBank.id}` ? "Rejecting…" : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        )}

      </Section>
    </div>
  );
}
