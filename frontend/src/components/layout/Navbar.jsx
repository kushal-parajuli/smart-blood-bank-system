// src/components/layout/Navbar.jsx
// Production-grade healthcare navigation bar with role-aware controls,
// emergency requisition shortcut, and supportive dark theme styling.

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, 
  Droplet, 
  Siren, 
  Search, 
  HeartHandshake, 
  ShieldCheck, 
  User, 
  LogOut, 
  Building2, 
  Activity,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  // Determine role-based primary dashboard destination
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin/dashboard";
    if (user.role === "blood_bank") return "/bank/dashboard";
    return "/dashboard";
  };

  const dashboardPath = getDashboardPath();

  const isRole = (role) => user?.role === role;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--color-surface)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        
        {/* Brand identity */}
        <Link 
          to="/" 
          onClick={() => setMenuOpen(false)} 
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white shadow-sm shadow-teal-900/30 group-hover:scale-105 transition-transform duration-200">
            <Droplet size={18} className="fill-white text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-[var(--foreground)] leading-none">
              Smart<span className="text-[var(--primary)] font-extrabold">Blood</span>
            </span>
            <span className="text-[10px] font-medium tracking-wider text-[var(--muted-foreground)] uppercase">
              Clinical Supply Net
            </span>
          </div>
        </Link>

        {/* Desktop primary clinical navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            to="/search"
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
              location.pathname === "/search" 
                ? "text-[var(--primary)] font-semibold" 
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <Search size={15} /> Find Blood
          </Link>

          <Link
            to={user ? "/donate" : "/donor/register"}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
              location.pathname === "/donate" || location.pathname === "/donor/register"
                ? "text-[var(--primary)] font-semibold" 
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <HeartHandshake size={15} /> Donate Blood
          </Link>

          <a
            href="/#ai-assistant"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Activity size={15} /> AI First Aid
            <span className="text-[10px] bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)] px-1.5 py-0.5 rounded-full font-semibold">
              Preview
            </span>
          </a>

          {/* Institutional portal shortcut if not logged in */}
          {!user && (
            <Link
              to="/register/blood-bank"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <Building2 size={15} /> For Blood Banks
            </Link>
          )}
        </nav>

        {/* Action Controls & Authentication status */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Emergency Requisition Quick CTA */}
          <Button 
            asChild 
            variant="destructive" 
            size="sm" 
            className="shadow-sm shadow-red-950/40 gap-1.5 font-semibold"
          >
            <Link to="/request">
              <Siren size={15} className="animate-pulse" /> Emergency Request
            </Link>
          </Button>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              <Link 
                to={dashboardPath}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
                title="Go to Dashboard"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--primary)] font-bold text-xs border border-[var(--color-brand-border)]">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--foreground)] leading-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isRole("admin") && (
                      <Badge variant="solid" className="text-[9px] py-0 px-1 bg-purple-700 text-white">
                        Admin
                      </Badge>
                    )}
                    {isRole("blood_bank") && (
                      <Badge variant="solid" className="text-[9px] py-0 px-1 bg-teal-600 text-white">
                        Blood Bank
                      </Badge>
                    )}
                    {isRole("user") && (
                      <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                        Patient / Donor
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                title="Log out" 
                className="text-[var(--muted-foreground)] hover:text-white"
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile controls: Emergency link + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild variant="destructive" size="sm" className="px-2.5 py-1 text-xs">
            <Link to="/request">
              <Siren size={13} /> Request
            </Link>
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 text-[var(--foreground)]" 
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent open={menuOpen} className="w-[300px] sm:w-[360px] bg-[var(--color-surface)] border-[var(--border)] text-[var(--foreground)]">
              <div className="flex flex-col h-full justify-between pt-10 pb-6 px-4">
                <div className="space-y-6">
                  {/* Brand & User identity in drawer */}
                  <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                      {user ? user.name.charAt(0).toUpperCase() : <Droplet size={18} />}
                    </div>
                    <div>
                      {user ? (
                        <>
                          <p className="text-sm font-bold text-[var(--foreground)]">{user.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] uppercase font-semibold text-[var(--primary)] tracking-wide">
                            {user.role}
                          </span>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-[var(--foreground)]">Smart Blood Bank</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Healthcare Supply Network</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-1">
                    <Link
                      to="/search"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Search size={16} className="text-[var(--primary)]" /> Find Blood Availability
                      </span>
                      <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                    </Link>

                    <Link
                      to={user ? "/donate" : "/donor/register"}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="flex items-center gap-2.5">
                        <HeartHandshake size={16} className="text-[var(--primary)]" /> Donate Blood
                      </span>
                      <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                    </Link>

                    <Link
                      to="/request"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-red-300 bg-[var(--color-urgent-subtle)] hover:bg-red-950/60"
                    >
                      <span className="flex items-center gap-2.5">
                        <Siren size={16} /> Urgent Blood Request
                      </span>
                      <ChevronRight size={15} className="text-red-400" />
                    </Link>

                    {user && (
                      <Link
                        to={dashboardPath}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
                      >
                        <span className="flex items-center gap-2.5">
                          <ShieldCheck size={16} className="text-[var(--primary)]" /> Dashboard &amp; Activity
                        </span>
                        <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                      </Link>
                    )}

                    <a
                      href="/#ai-assistant"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Activity size={16} className="text-[var(--primary)]" /> AI First Aid Assistant
                      </span>
                      <span className="text-[10px] bg-[var(--color-surface-subtle)] text-[var(--muted-foreground)] px-2 py-0.5 rounded">Preview</span>
                    </a>

                    {!user && (
                      <Link
                        to="/register/blood-bank"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
                      >
                        <span className="flex items-center gap-2.5">
                          <Building2 size={16} className="text-[var(--primary)]" /> Blood Bank Registration
                        </span>
                        <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Mobile Drawer Bottom Actions */}
                <div className="pt-4 border-t border-[var(--border)]">
                  {user ? (
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="w-full justify-center gap-2"
                    >
                      <LogOut size={16} /> Log Out
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline">
                        <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                      </Button>
                      <Button asChild>
                        <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
}