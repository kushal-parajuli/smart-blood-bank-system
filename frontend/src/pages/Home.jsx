// src/pages/Home.jsx

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, HeartHandshake, Siren, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";
import PulseLine from "../components/common/PulseLine";
import SpotlightBackground from "../components/common/SpotlightBackground";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const services = [
  {
    icon: Search,
    title: "Search blood availability",
    description: "Check which blood banks near you have your blood group in stock right now.",
    action: "Search availability",
    to: "/search",
  },
  {
    icon: HeartHandshake,
    title: "Donate blood",
    description: "Set up your donor profile once, then book a donation appointment at a bank near you whenever you're ready to give.",
    action: "Donate blood",
    to: "/donor/register",
  },
  {
    icon: Siren,
    title: "Request blood",
    description: "Submit a request for yourself or someone else — mark it urgent if it's an emergency.",
    action: "Request blood",
    to: "/request",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <SpotlightBackground />

        <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-24">
          <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.12, delayChildren: 0.15 }} className="mx-auto max-w-3xl text-center">
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="mx-auto mb-6 gap-1.5 border-[var(--primary)]/30 bg-white px-3 py-1.5 text-[var(--primary)]">
                <ShieldCheck size={14} /> Trusted by donors, patients &amp; blood banks
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="font-[var(--font-display)] text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-6xl"
            >
              Blood, when it's needed —
              <br />
              <span className="bg-gradient-to-r from-[var(--primary)] to-[#14b8a6] bg-clip-text text-transparent">
                found faster.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg"
            >
              A connected platform linking patients, donors, and blood banks —
              so availability, donation, and emergency requests all happen in one place.
            </motion.p>

            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/search">
                  Search blood availability <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/donor/register">Donate blood</Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-14">
              <PulseLine className="mx-auto h-14 w-full max-w-xl opacity-70" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-[var(--border)] bg-white">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ staggerChildren: 0.15 }}
          className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3"
        >
          {[
            { label: "Lives per donation", value: "Up to 3" },
            { label: "Blood groups tracked", value: "8" },
            { label: "Ways to help", value: "Donate or request" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.5 }} className="text-center">
              <p className="font-[var(--font-mono)] text-3xl font-semibold text-[var(--primary)]">{stat.value}</p>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mx-auto max-w-xl text-center">
          <Badge variant="default" className="mb-3">What you can do here</Badge>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Everything in one place
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.12 }}
          className="mt-14 grid gap-6 sm:grid-cols-3"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.title} variants={fadeUp} transition={{ duration: 0.5 }} whileHover={{ y: -6 }}>
                <Card className="h-full hover:shadow-lg hover:shadow-[var(--primary)]/5">
                  <CardContent className="p-7">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]">
                      <Icon size={20} />
                    </div>
                    <h3 className="mt-5 font-[var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {service.description}
                    </p>
                    <Link
                      to={service.to}
                      className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:gap-2 transition-all"
                    >
                      {service.action} <ArrowRight size={14} />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* AI FIRST AID */}
      <section id="ai-assistant" className="relative overflow-hidden bg-[var(--foreground)] py-24">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, var(--primary), transparent 45%)" }} />
        <div className="relative mx-auto max-w-6xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10"
          >
            <Badge variant="destructive" className="gap-1.5">
              <MessageCircle size={12} /> Coming soon
            </Badge>
            <h2 className="mt-5 font-[var(--font-display)] text-2xl font-bold text-white sm:text-3xl">
              AI First Aid Assistant
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Free, no login required. Get immediate first aid guidance while
              help is on the way — it never replaces a doctor, and nothing
              you ask is stored beyond your current session.
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex-1 text-sm text-white/50">Describe what happened…</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/60">
                Not available yet
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}