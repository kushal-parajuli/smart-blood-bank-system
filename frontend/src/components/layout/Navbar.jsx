// src/components/layout/Navbar.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Droplet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#ai-assistant", label: "AI First Aid" },
  { href: "#about", label: "About" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  const dashboardPath = user?.role === "blood_bank" ? "/bank/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]">
            <Droplet size={16} className="fill-white text-white" />
          </div>
          <span className="font-[var(--font-display)] text-lg font-bold tracking-tight text-[var(--foreground)]">
            Smart<span className="text-[var(--primary)]">BloodBank</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to={dashboardPath} className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                Dashboard
              </Link>
              <span className="text-sm text-[var(--muted-foreground)]">
                Hi, <span className="font-semibold text-[var(--foreground)]">{user.name?.split(" ")[0]}</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                Log in
              </Link>
              <Button asChild size="sm">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: hamburger opens a shadcn Sheet drawer */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)}>
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent open={menuOpen}>
            <div className="flex flex-col gap-1 px-5 pt-16">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-3 border-t border-[var(--border)] pt-4">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to={dashboardPath}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                      Dashboard
                    </Link>
                    <p className="px-3 text-sm text-[var(--muted-foreground)]">
                      Hi, <span className="font-semibold text-[var(--foreground)]">{user.name?.split(" ")[0]}</span>
                    </p>
                    <Button variant="outline" onClick={handleLogout} className="mt-1">Log out</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" asChild>
                      <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}