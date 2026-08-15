// src/components/layout/Navbar.jsx

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-mist)] bg-[var(--color-paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="font-[var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-ink)]"
        >
          Smart<span className="text-[var(--color-brand)]">BloodBank</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#services" className="text-sm font-medium text-[var(--color-slate)] hover:text-[var(--color-ink)]">
            Services
          </a>
          <a href="#ai-assistant" className="text-sm font-medium text-[var(--color-slate)] hover:text-[var(--color-ink)]">
            AI First Aid
          </a>
          <a href="#about" className="text-sm font-medium text-[var(--color-slate)] hover:text-[var(--color-ink)]">
            About
          </a>
        </nav>

        {user ? (
          <div className="flex items-center gap-4">
            {user.role === "blood_bank" && (
              <Link
                to="/bank/dashboard"
                className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-brand)]"
              >
                Dashboard
              </Link>
            )}
            <span className="text-sm text-[var(--color-slate)]">
              Hi, <span className="font-semibold text-[var(--color-ink)]">{user.name?.split(" ")[0]}</span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-[var(--color-mist)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-urgent)] hover:text-[var(--color-urgent)]"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-brand)]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-dark)]"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}