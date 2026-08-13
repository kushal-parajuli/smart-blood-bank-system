// src/components/common/PulseLine.jsx
//
// The page's signature element: an ECG/vitals-monitor line that draws
// itself in once, then spikes into a medical cross at its peak. This is
// the one deliberate visual risk on the homepage — everything else stays
// quiet and disciplined around it, per design intent. Also a deliberate
// visual echo of the pulse-line icon already used in the AI First Aid
// Assistant's own frontend, so the two products will feel related once
// integrated in the final phase.
//
// The actual draw-in animation (stroke-dasharray/dashoffset + reduced-motion
// fallback) lives in index.css as the .pulse-draw class, applied here.

export default function PulseLine({ className = "" }) {
  return (
    <svg
      viewBox="0 0 600 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 60 H180 L210 20 L240 100 L270 40 L300 60
           H330 L345 60 L360 15 L375 105 L390 60
           H600"
        stroke="var(--color-brand)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pulse-draw"
      />
    </svg>
  );
}