// src/pages/Home.jsx
// Healthcare platform homepage featuring immediate inventory triage,
// clear patient/donor/facility pathways, eligibility guidance, and verified network metrics.
// Fully styled with supportive dark clinical theme.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  HeartHandshake, 
  Siren, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Building2, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Award,
  Sparkles,
  MapPin,
  AlertTriangle,
  Droplet
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import Section from "../components/layout/Section";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const POPULAR_DISTRICTS = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Kaski",
  "Chitwan",
  "Morang",
  "Rupandehi",
];

const ELIGIBILITY_RULES = [
  { title: "Age Requirement", desc: "Between 18 and 60 years old." },
  { title: "Healthy Weight", desc: "At least 45 kg (100 lbs)." },
  { title: "Donation Interval", desc: "Minimum 90 days (3 months) since last donation." },
  { title: "Overall Wellbeing", desc: "No acute infection, fever, or ongoing antibiotic treatment." },
];

const DONATION_STEPS = [
  {
    step: "01",
    title: "Quick Registration",
    desc: "Create your donor profile with your verified blood group, district, and contact info.",
    icon: FileText
  },
  {
    step: "02",
    title: "Schedule Slot",
    desc: "Select a certified nearby blood bank and book a convenient date and time window.",
    icon: Clock
  },
  {
    step: "03",
    title: "Clinical Screening",
    desc: "A brief on-site hemoglobin and blood pressure check ensures complete donor safety.",
    icon: ShieldCheck
  },
  {
    step: "04",
    title: "Save Lives",
    desc: "A 15-minute donation can provide packed RBCs, platelets, and plasma for up to 3 patients.",
    icon: Award
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  function handleQuickSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedGroup) params.set("blood_group", selectedGroup);
    if (selectedDistrict) params.set("district", selectedDistrict);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      
      {/* HERO SECTION: Medical Precision & Direct Search */}
      <section className="relative bg-gradient-to-b from-teal-950/30 via-[var(--color-surface)] to-[var(--background)] pt-12 pb-20 border-b border-[var(--border)] overflow-hidden">
        {/* Subtle medical grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        <Section size="wide" className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left: Clinical Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand-border)] text-[var(--color-brand-hover)] text-xs font-semibold">
                <ShieldCheck size={14} className="text-[var(--primary)]" />
                <span>Verified Transfusion &amp; Donor Network</span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.12]">
                Critical Blood Supply Coordination When <span className="text-[var(--primary)]">Every Second Matters</span>.
              </h1>

              <p className="text-base sm:text-lg text-[var(--muted-foreground)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Connect directly with certified blood banks, real-time inventory, and registered voluntary donors across Nepal to expedite life-saving transfusions.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {user?.role === "admin" ? (
                  <>
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white font-semibold gap-2 shadow-md shadow-purple-950/50"
                    >
                      <Link to="/admin/dashboard">
                        <ShieldCheck size={18} /> Open Admin Console
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto bg-[var(--card)] hover:bg-[var(--color-surface-elevated)] border-[var(--border)] text-[var(--foreground)]"
                    >
                      <Link to="/admin/dashboard?tab=banks">
                        <Building2 size={18} className="text-purple-400" /> Facility Verifications
                      </Link>
                    </Button>
                  </>
                ) : user?.role === "blood_bank" ? (
                  <>
                    <Button 
                      asChild 
                      size="lg" 
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-2 shadow-md shadow-teal-950/50"
                    >
                      <Link to="/bank/dashboard">
                        <Building2 size={18} /> Open Bank Dashboard
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto bg-[var(--card)] hover:bg-[var(--color-surface-elevated)] border-[var(--border)] text-[var(--foreground)]"
                    >
                      <Link to="/bank/dashboard?section=inventory">
                        <Droplet size={18} className="text-teal-400" /> Manage Blood Stock
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      asChild 
                      variant="destructive" 
                      size="lg" 
                      className="w-full sm:w-auto shadow-md shadow-red-950/50 font-semibold gap-2"
                    >
                      <Link to="/request">
                        <Siren size={18} className="animate-pulse" /> Emergency Blood Requisition
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto bg-[var(--card)] hover:bg-[var(--color-surface-elevated)] border-[var(--border)] text-[var(--foreground)]"
                    >
                      <Link to={user ? "/donate" : "/donor/register"}>
                        <HeartHandshake size={18} className="text-[var(--primary)]" /> {user ? "Schedule Donation" : "Register as a Donor"}
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Trust Badge Bar */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-[var(--muted-foreground)] font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[var(--primary)]" /> Certified Facilities
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[var(--primary)]" /> Non-Profit Coordination
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[var(--primary)]" /> Direct Bank Dispatch
                </span>
              </div>
            </div>

            {/* Hero Right: Direct In-Hero Triage Search Tool */}
            <div className="lg:col-span-5">
              <Card variant="elevated" className="border-[var(--border)] shadow-xl shadow-black/40 bg-[var(--card)] p-6 sm:p-7">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Search size={18} className="text-[var(--primary)]" /> Quick Stock Lookup
                    </h2>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Locate compatible units at verified banks</p>
                  </div>
                  <Badge variant="outline" className="text-xs text-[var(--color-brand-hover)] border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]">
                    Live Sync
                  </Badge>
                </div>

                <form onSubmit={handleQuickSearch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                      1. Required Blood Group
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((group) => {
                        const isSelected = selectedGroup === group;
                        return (
                          <button
                            type="button"
                            key={group}
                            onClick={() => setSelectedGroup(isSelected ? "" : group)}
                            className={`h-11 rounded-lg border text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer ${
                              isSelected
                                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-teal-900/40"
                                : "bg-[var(--color-surface-subtle)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--color-surface-elevated)]"
                            }`}
                          >
                            {group}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5">
                      2. District Location
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--color-surface-subtle)] text-sm font-medium text-[var(--foreground)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">All Districts in Nepal</option>
                        {POPULAR_DISTRICTS.map((dist) => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full font-semibold gap-2 mt-2">
                    <Search size={16} /> Check Bank Availability
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t border-[var(--border)] text-center">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Are you a hospital or transmuter?{" "}
                    <Link to="/search" className="text-[var(--primary)] font-semibold hover:underline">
                      Advanced directory view →
                    </Link>
                  </p>
                </div>
              </Card>
            </div>

          </div>
        </Section>
      </section>

      {/* OPERATIONAL METRICS BAR */}
      <section className="border-b border-[var(--border)] bg-[var(--card)]/50 py-8">
        <Section size="wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)]">
              <p className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--primary)]">100%</p>
              <p className="text-xs font-medium text-[var(--muted-foreground)] mt-1 uppercase tracking-wider">Verified Transfusion Centers</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)]">
              <p className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--foreground)]">8 Groups</p>
              <p className="text-xs font-medium text-[var(--muted-foreground)] mt-1 uppercase tracking-wider">ABO &amp; Rh Factor Tracking</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)]">
              <p className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--primary)]">24 / 7</p>
              <p className="text-xs font-medium text-[var(--muted-foreground)] mt-1 uppercase tracking-wider">Emergency Coordination</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)]">
              <p className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--foreground)]">3 Lives</p>
              <p className="text-xs font-medium text-[var(--muted-foreground)] mt-1 uppercase tracking-wider">Impact per Whole Blood Unit</p>
            </div>
          </div>
        </Section>
      </section>

      {/* PRIMARY TRIAGE PATHWAYS */}
      <section className="py-20 bg-[var(--background)]">
        <Section size="wide">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="text-[var(--color-brand-hover)] border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] mb-3">
              Platform Architecture
            </Badge>
            <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
              Purpose-Built for Every Participant
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">
              Whether you need blood immediately, wish to volunteer, or manage an institutional repository, SmartBlood organizes your clinical workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pathway 1: Urgent Blood Search / Request */}
            <Card variant="default" className="flex flex-col justify-between hover:border-red-900/60 hover:shadow-md transition-all">
              <CardContent className="p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/60 text-red-400 mb-5 border border-red-900/40">
                  <Siren size={24} />
                </div>
                <h3 className="font-heading text-xl font-bold text-[var(--foreground)] mb-2">
                  For Patients &amp; Hospitals
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                  Locate verified inventory at nearby banks in seconds. Submit emergency blood requisitions with required units and hospital ward details.
                </p>
                <div className="space-y-2.5 text-xs text-[var(--muted-foreground)] font-medium border-t border-[var(--border)] pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" /> Live stock level transparency
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" /> Direct bank dispatch contact numbers
                  </div>
                </div>
              </CardContent>
              <div className="p-7 pt-0">
                <Button asChild variant="outline" className="w-full justify-between hover:bg-red-950/40 hover:text-red-300 hover:border-red-900/50">
                  <Link to="/search">
                    <span>Find Blood Now</span> <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Pathway 2: Voluntary Donors */}
            <Card variant="default" className="flex flex-col justify-between hover:border-[var(--color-brand)]/50 hover:shadow-md transition-all">
              <CardContent className="p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--primary)] mb-5 border border-[var(--color-brand-border)]">
                  <HeartHandshake size={24} />
                </div>
                <h3 className="font-heading text-xl font-bold text-[var(--foreground)] mb-2">
                  For Voluntary Donors
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                  Maintain a single verified donor profile. Schedule convenient appointments at certified blood banks, track donation records, and receive reminders.
                </p>
                <div className="space-y-2.5 text-xs text-[var(--muted-foreground)] font-medium border-t border-[var(--border)] pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" /> Easy appointment booking
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" /> Digital donation history &amp; milestones
                  </div>
                </div>
              </CardContent>
              <div className="p-7 pt-0">
                <Button asChild className="w-full justify-between">
                  <Link to="/donor/register">
                    <span>Join Donor Network</span> <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Pathway 3: Blood Banks & Centers */}
            <Card variant="default" className="flex flex-col justify-between hover:border-slate-700 hover:shadow-md transition-all">
              <CardContent className="p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-subtle)] text-[var(--foreground)] mb-5 border border-[var(--border)]">
                  <Building2 size={24} />
                </div>
                <h3 className="font-heading text-xl font-bold text-[var(--foreground)] mb-2">
                  For Transfusion Centers
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                  Streamline repository management. Update blood unit reserves in real time, review incoming donor appointments, and record clinical donations safely.
                </p>
                <div className="space-y-2.5 text-xs text-[var(--muted-foreground)] font-medium border-t border-[var(--border)] pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" /> Automated inventory adjustments
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--primary)]" /> Official facility license verification
                  </div>
                </div>
              </CardContent>
              <div className="p-7 pt-0">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link to="/register/blood-bank">
                    <span>Facility Registration</span> <ArrowRight size={15} />
                  </Link>
                </Button>
              </div>
            </Card>

          </div>
        </Section>
      </section>

      {/* DONATION STEPS & ELIGIBILITY CRITERIA */}
      <section id="eligibility" className="py-20 bg-[var(--card)]/40 border-t border-[var(--border)]">
        <Section size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Steps (Left 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <Badge variant="outline" className="text-[var(--color-brand-hover)] border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] mb-2">
                  Donation Lifecycle
                </Badge>
                <h2 className="font-heading text-3xl font-bold text-[var(--foreground)]">
                  How Donating Blood Works
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  A transparent, medically safe process from registration to recovery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {DONATION_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div 
                      key={step.step}
                      className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--color-brand)]/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded border border-[var(--color-brand-border)]">
                          {step.step}
                        </span>
                        <Icon size={18} className="text-[var(--muted-foreground)]" />
                      </div>
                      <h4 className="font-heading font-semibold text-[var(--foreground)] text-sm mb-1.5">
                        {step.title}
                      </h4>
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button asChild size="default">
                  <Link to={user?.role === "admin" ? "/admin/dashboard?tab=donors" : user?.role === "blood_bank" ? "/bank/dashboard" : "/donate"}>
                    {user?.role === "admin" 
                      ? "Review Donor Verifications" 
                      : user?.role === "blood_bank" 
                      ? "View Transfusion Facility Status" 
                      : "Schedule Your Donation Appointment"} 
                    <ArrowRight size={15} className="ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Eligibility Checklist (Right 5 cols) */}
            <div className="lg:col-span-5">
              <Card variant="subtle" className="border-[var(--border)] p-6 sm:p-7">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={20} className="text-[var(--primary)]" />
                  <h3 className="font-heading text-lg font-bold text-[var(--foreground)]">
                    Donor Eligibility Checklist
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mb-6">
                  Review these standard healthcare criteria prior to scheduling an appointment:
                </p>

                <div className="space-y-4">
                  {ELIGIBILITY_RULES.map((rule) => (
                    <div key={rule.title} className="flex items-start gap-3 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                      <div className="h-5 w-5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-[var(--color-brand-border)]">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--foreground)]">{rule.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{rule.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Note:</strong> Final eligibility is determined on-site by certified blood bank medical staff through a quick test.
                  </span>
                </div>
              </Card>
            </div>

          </div>
        </Section>
      </section>

      {/* AI FIRST AID ASSISTANT (PRESERVED TEASER SECTION) */}
      <section id="ai-assistant" className="py-20 bg-slate-950 text-white relative overflow-hidden border-t border-[var(--border)]">
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

        <Section size="default" className="relative text-center max-w-3xl">
          <Badge variant="outline" className="text-teal-400 border-teal-500/40 bg-teal-950/60 mb-4 inline-flex items-center gap-1.5">
            <Sparkles size={13} /> Standalone Clinical Innovation
          </Badge>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            AI First Aid Assistant
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
            An offline-capable emergency triage guidance tool providing step-by-step first aid protocols while emergency medical dispatch is en route. Fully anonymous and non-diagnostic.
          </p>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-xl mx-auto text-left space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Activity size={14} className="text-teal-400" /> Real-time First Response Simulator
              </span>
              <span className="bg-teal-950 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded font-mono text-[11px]">
                Under Development
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <span className="flex-1">e.g., &quot;Severe laceration bleeding control protocol...&quot;</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-500 text-[11px] font-medium">
                Locked Preview
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              * The assistant is designed as a bystander aid and does not substitute certified emergency physician evaluation.
            </p>
          </div>
        </Section>
      </section>

    </div>
  );
}