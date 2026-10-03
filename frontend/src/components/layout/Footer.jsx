// src/components/layout/Footer.jsx
// Healthcare platform footer with regulatory clarity, emergency hotline guidance,
// quick navigation, and clinical disclaimer.

import { Link } from "react-router-dom";
import { Droplet, PhoneCall, ShieldAlert, Heart, CheckCircle2 } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="border-t border-[var(--border)] bg-slate-900 text-slate-300">

      {/* Emergency Hotline Banner */}
      <div className="bg-red-950/70 border-b border-red-900/60 text-red-200 py-3.5 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <span>
              <strong>Life-Threatening Emergency?</strong> Call national medical emergency services immediately (102 in Nepal / local emergency dispatch).
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <PhoneCall size={13} className="text-red-400" /> Red Cross Blood Dispatch: 1130
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand & Purpose (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                <Droplet size={18} className="fill-white" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-white">
                Smart<span className="text-teal-400">Blood</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A verified digital coordination infrastructure connecting patients, certified blood transfusion centers, and voluntary donors to reduce supply lag during clinical emergencies.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium pt-1">
              <CheckCircle2 size={14} /> Certified Blood Bank Inventory Network
            </div>
          </div>

          {/* Patient & Citizen Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Patient Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  Find Blood Availability
                </Link>
              </li>
              <li>
                <Link to="/request" className="text-red-300 hover:text-red-200 font-medium transition-colors">
                  Submit Urgent Requisition
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Track Requisition Status
                </Link>
              </li>
              <li>
                <a href="/#ai-assistant" className="hover:text-white transition-colors">
                  AI First Aid Guidance
                </a>
              </li>
            </ul>
          </div>

          {/* Donors & Community */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Voluntary Donors
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/donor/register" className="hover:text-white transition-colors">
                  Register as Blood Donor
                </Link>
              </li>
              <li>
                <Link to="/donate" className="hover:text-white transition-colors">
                  Schedule Donation
                </Link>
              </li>
              <li>
                <a href="#eligibility" className="hover:text-white transition-colors">
                  Eligibility Criteria
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Donation History &amp; Badges
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Facilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Transfusion Centers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register/blood-bank" className="hover:text-white transition-colors">
                  Facility Registration
                </Link>
              </li>
              <li>
                <Link to="/bank/dashboard" className="hover:text-white transition-colors">
                  Inventory Management
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Institutional Staff Login
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal & Academic Project Disclaimer */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {currentYear} Smart Blood Bank Management System. Built for academic, demonstration, and clinical logistics research.
          </p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Use</span>
            <span className="flex items-center gap-1 text-slate-300">
              <b>Made for community health BY: Kushal Parajuli </b>

            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}