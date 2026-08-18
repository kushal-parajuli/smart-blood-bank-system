// src/components/common/SpotlightBackground.jsx
//
// Aceternity-style ambient hero background: a soft radial glow that
// drifts slowly, over a faint dot grid. This is the one "visually
// impressive" set-piece per the design brief — used ONLY in hero
// sections, never on functional pages (forms, dashboards), so it adds
// atmosphere without ever getting in the way of actually using the app.

export default function SpotlightBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Faint dot grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(var(--color-mist) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Drifting spotlight glow */}
      <div
        className="spotlight-glow absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-60 blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--color-brand) 0%, transparent 70%)",
        }}
      />
      {/* Fade to page background at the edges so the effect doesn't hard-cut */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--color-paper)]" />
    </div>
  );
}