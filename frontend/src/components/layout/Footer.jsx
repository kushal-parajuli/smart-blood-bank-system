// src/components/layout/Footer.jsx

export default function Footer() {
  return (
    <footer id="about" className="border-t border-[var(--color-mist)] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink)]">
              Smart<span className="text-[var(--color-brand)]">BloodBank</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--color-slate)]">
              A connected platform for blood availability, donor coordination,
              and emergency requests — built as a BCA final year project.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">For patients & donors</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-slate)]">
              <li>Search blood availability</li>
              <li>Register as a donor</li>
              <li>Request blood in an emergency</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">For blood banks</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-slate)]">
              <li>Manage inventory</li>
              <li>Coordinate donor appointments</li>
              <li>Respond to requests</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--color-mist)] pt-6 text-xs text-[var(--color-slate)]">
          © {new Date().getFullYear()} Smart Blood Bank Management System. Academic project — not a substitute for emergency medical services.
        </div>
      </div>
    </footer>
  );
}