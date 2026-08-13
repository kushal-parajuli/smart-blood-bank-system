// src/pages/Home.jsx

import { Link } from "react-router-dom";
import PulseLine from "../components/common/PulseLine";

const services = [
  {
    title: "Search blood availability",
    description:
      "Check which blood banks near you have your blood group in stock right now.",
    action: "Search availability",
    to: "/search",
  },
  {
    title: "Donate blood",
    description:
      "Set up your donor profile once, then book a donation appointment at a bank near you whenever you're ready to give.",
    action: "Donate blood",
    to: "/register",
  },
  {
    title: "Request blood",
    description:
      "Submit a request for yourself or someone else — mark it urgent if it's an emergency.",
    action: "Request blood",
    to: "/register",
  },
];

export default function Home() {
  return (
    <>
      {/* HERO — framed as a vitals monitor. The pulse line is the one
          deliberate visual signature; everything else stays quiet. */}
      <section className="relative overflow-hidden bg-[var(--color-paper)]">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-20">
          <PulseLine className="mx-auto mb-10 h-16 w-full max-w-2xl" />

          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-[var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-ink)] sm:text-5xl">
              Blood, when it's needed —
              <br />
              found faster.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--color-slate)] sm:text-lg">
              A connected platform linking patients, donors, and blood banks —
              so availability, donation, and emergency requests all happen in
              one place.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/search"
                className="w-full rounded-full bg-[var(--color-brand)] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)] sm:w-auto"
              >
                Search blood availability
              </Link>
              <Link
                to="/register"
                className="w-full rounded-full border border-[var(--color-brand)] px-6 py-3 text-center text-sm font-semibold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-light)] sm:w-auto"
              >
                Donate blood
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* VITALS / STATS — styled like monitor readouts, monospace,
          grounded in real, general donation facts rather than invented metrics. */}
      <section className="border-y border-[var(--color-mist)] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          {[
            { label: "Lives per donation", value: "Up to 3" },
            { label: "Blood groups tracked", value: "8" },
            { label: "Ways to help", value: "Donate or request" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-[var(--font-mono)] text-3xl font-semibold text-[var(--color-brand)]">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--color-slate)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
            What you can do here
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-[var(--color-mist)] bg-white p-6 transition hover:border-[var(--color-brand)]"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--color-brand)]" />
              <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-slate)]">
                {service.description}
              </p>
              <Link
                to={service.to}
                className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-dark)]"
              >
                {service.action} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* AI FIRST AID — Coming Soon. Real UI slot, not a stub comment,
          so wiring in the real assistant later is a swap, not a rebuild. */}
      <section id="ai-assistant" className="bg-[var(--color-brand-light)]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--color-mist)] bg-white p-8 shadow-sm sm:p-10">
            <span className="inline-block rounded-full bg-[var(--color-urgent)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Coming soon
            </span>
            <h2 className="mt-4 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
              AI First Aid Assistant
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--color-slate)] sm:text-base">
              Free, no login required. Get immediate first aid guidance while
              help is on the way — it never replaces a doctor, and nothing
              you ask is stored beyond your current session.
            </p>

            {/* Disabled preview of the chat input, so the layout is already
                real when the assistant is wired in — not a placeholder box. */}
            <div className="mt-6 flex items-center gap-2 rounded-full border border-[var(--color-mist)] bg-[var(--color-paper)] px-4 py-3 opacity-60">
              <span className="flex-1 text-sm text-[var(--color-slate)]">
                Describe what happened…
              </span>
              <span className="rounded-full bg-[var(--color-ink)]/10 px-3 py-1 text-xs font-medium text-[var(--color-slate)]">
                Not available yet
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}