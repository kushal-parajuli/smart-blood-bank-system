// src/pages/user/UserDashboard.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, FileText, HeartHandshake, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ProfileTab from "./ProfileTab";
import MyRequestsTab from "./MyRequestsTab";
import MyDonationsTab from "./MyDonationsTab";
import BloodBanksTab from "./BloodBanksTab";
import { Badge } from "../../components/ui/badge";

const TABS = [
  { key: "profile", label: "Profile", icon: User, Component: ProfileTab },
  { key: "requests", label: "My Requests", icon: FileText, Component: MyRequestsTab },
  { key: "donations", label: "My Donations", icon: HeartHandshake, Component: MyDonationsTab },
  { key: "banks", label: "Blood Banks", icon: Building2, Component: BloodBanksTab },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* HEADER BAR */}
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-[var(--font-display)] text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
                Personal Portal
              </h1>
              <Badge variant="outline" className="border-[var(--primary)]/30 text-[var(--primary)] text-xs">
                {user?.role === "admin" ? "Admin" : user?.role === "blood_bank" ? "Blood Bank" : "User Account"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] sm:text-sm">
              Manage your personal credentials, view requisition status, and track voluntary donation appointments.
            </p>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-px scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-xs sm:text-sm font-semibold transition ${
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="dashboardTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT WITH TRANSITIONS */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}