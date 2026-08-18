// src/pages/user/UserDashboard.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileTab from "./ProfileTab";
import MyRequestsTab from "./MyRequestsTab";
import MyDonationsTab from "./MyDonationsTab";
import BloodBanksTab from "./BloodBanksTab";

const TABS = [
  { key: "profile", label: "Profile", Component: ProfileTab },
  { key: "requests", label: "My Requests", Component: MyRequestsTab },
  { key: "donations", label: "My Donations", Component: MyDonationsTab },
  { key: "banks", label: "Blood Banks", Component: BloodBanksTab },
];

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("profile");
  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component;

  return (
    <section className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">Dashboard</h1>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--color-mist)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key ? "text-[var(--color-brand)]" : "text-[var(--color-slate)] hover:text-[var(--color-ink)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="dashboardTabIndicator"
                className="absolute -bottom-px left-0 right-0 h-0.5 bg-[var(--color-brand)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}