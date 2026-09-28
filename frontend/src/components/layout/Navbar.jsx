// src/components/layout/Navbar.jsx
// Production-grade healthcare navigation bar with strict role-segregated navigation,
// clinical quick-actions, and responsive mobile drawer support.

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
  ChevronRight,
  Users,
  Boxes,
  Plus,
  LayoutDashboard,
  FileText
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";
import Avatar from "../common/Avatar";

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

  const role = user?.role;
  const isAdmin = role === "admin";
  const isBank = role === "blood_bank";
  const isUser = role === "user";
  const isGuest = !user;

  // Determine brand link based on user role
  const getBrandHome = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isBank) return "/bank/dashboard";
    return "/";
  };

  // Determine primary dashboard path
  const getDashboardPath = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isBank) return "/bank/dashboard";
    if (isUser) return "/dashboard";
    return "/login";
  };

  const dashboardPath = getDashboardPath();
  const brandHome = getBrandHome();

  // Helper to determine active link styling
  const isActive = (path, search = "") => {
    if (search) {
      return location.pathname === path && location.search.includes(search);
    }
    if (path === "/admin/dashboard") {
      return (
        (location.pathname === "/admin/dashboard" || location.pathname === "/admin") &&
        (!location.search || location.search.includes("tab=overview"))
      );
    }
    if (path === "/bank/dashboard") {
      return location.pathname === "/bank/dashboard" && !location.search.includes("section=");
    }
    return location.pathname === path;
  };

  const navLinkClass = (active) =>
    `inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
      active
        ? "text-[var(--primary)] font-semibold"
        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
    }`;

  const drawerLinkClass = (active) =>
    `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-[var(--color-brand-subtle)] text-[var(--primary)] font-semibold"
        : "text-[var(--foreground)] hover:bg-[var(--color-surface-subtle)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--color-surface)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        
        {/* Brand Identity */}
        <Link 
          to={brandHome} 
          onClick={() => setMenuOpen(false)} 
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105 ${
            isAdmin 
              ? "bg-gradient-to-br from-purple-600 to-indigo-900 shadow-purple-950/40" 
              : isBank
              ? "bg-gradient-to-br from-teal-500 to-emerald-800 shadow-teal-950/40"
              : "bg-gradient-to-br from-teal-500 to-teal-800 shadow-teal-900/30"
          }`}>
            {isAdmin ? (
              <ShieldCheck size={18} className="text-white" />
            ) : isBank ? (
              <Building2 size={18} className="text-white" />
            ) : (
              <Droplet size={18} className="fill-white text-white" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-bold tracking-tight text-[var(--foreground)] leading-none">
                Smart<span className={isAdmin ? "text-purple-400 font-extrabold" : "text-[var(--primary)] font-extrabold"}>Blood</span>
              </span>
              {isAdmin && (
                <span className="rounded bg-purple-950/70 border border-purple-800/80 px-1.5 py-0.2 text-[9px] font-bold text-purple-300 uppercase tracking-wider">
                  Admin
                </span>
              )}
              {isBank && (
                <span className="rounded bg-teal-950/70 border border-teal-800/80 px-1.5 py-0.2 text-[9px] font-bold text-teal-300 uppercase tracking-wider">
                  Center
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-wider text-[var(--muted-foreground)] uppercase">
              {isAdmin 
                ? "System Governance" 
                : isBank 
                ? "Transfusion Portal" 
                : "Clinical Supply Net"}
            </span>
          </div>
        </Link>

        {/* ========================================================================= */}
        {/* DESKTOP ROLE-SPECIFIC PRIMARY NAVIGATION                                  */}
        {/* ========================================================================= */}
        <nav className="hidden lg:flex items-center gap-6">

          {/* 1. ADMIN NAVBAR LINKS */}
          {isAdmin && (
            <>
              <Link
                to="/admin/dashboard?tab=overview"
                className={navLinkClass(isActive("/admin/dashboard"))}
              >
                <Activity size={15} /> System Overview
              </Link>

              <Link
                to="/admin/dashboard?tab=banks"
                className={navLinkClass(isActive("/admin/dashboard", "tab=banks"))}
              >
                <Building2 size={15} /> Verify Facilities
              </Link>

              <Link
                to="/admin/dashboard?tab=donors"
                className={navLinkClass(isActive("/admin/dashboard", "tab=donors"))}
              >
                <HeartHandshake size={15} /> Verify Donors
              </Link>

              <Link
                to="/admin/dashboard?tab=users"
                className={navLinkClass(isActive("/admin/dashboard", "tab=users"))}
              >
                <Users size={15} /> User Governance
              </Link>

              <Link
                to="/search"
                className={navLinkClass(isActive("/search"))}
              >
                <Search size={15} /> Audit Stock
              </Link>
            </>
          )}

          {/* 2. BLOOD BANK NAVBAR LINKS */}
          {isBank && (
            <>
              <Link
                to="/bank/dashboard"
                className={navLinkClass(isActive("/bank/dashboard"))}
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>

              <Link
                to="/bank/dashboard?section=inventory"
                className={navLinkClass(isActive("/bank/dashboard", "section=inventory"))}
              >
                <Boxes size={15} /> Manage Inventory
              </Link>

              <Link
                to="/bank/dashboard?section=requests"
                className={navLinkClass(isActive("/bank/dashboard", "section=requests"))}
              >
                <FileText size={15} /> Incoming Requests
              </Link>

              <Link
                to="/search"
                className={navLinkClass(isActive("/search"))}
              >
                <Search size={15} /> Network Stock
              </Link>
            </>
          )}

          {/* 3. NORMAL USER (PATIENT / DONOR) NAVBAR LINKS */}
          {isUser && (
            <>
              <Link
                to="/search"
                className={navLinkClass(isActive("/search"))}
              >
                <Search size={15} /> Find Blood
              </Link>

              <Link
                to="/request"
                className={navLinkClass(isActive("/request"))}
              >
                <FileText size={15} /> Request Blood
              </Link>

              <Link
                to="/donate"
                className={navLinkClass(isActive("/donate"))}
              >
                <HeartHandshake size={15} /> Donate Blood
              </Link>

              <Link
                to="/dashboard"
                className={navLinkClass(isActive("/dashboard"))}
              >
                <ShieldCheck size={15} /> My Activity
              </Link>

              <a
                href="/#ai-assistant"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Activity size={15} /> AI First Aid
              </a>
            </>
          )}

          {/* 4. GUEST / PUBLIC NAVBAR LINKS */}
          {isGuest && (
            <>
              <Link
                to="/search"
                className={navLinkClass(isActive("/search"))}
              >
                <Search size={15} /> Find Blood
              </Link>

              <Link
                to="/donor/register"
                className={navLinkClass(isActive("/donor/register"))}
              >
                <HeartHandshake size={15} /> Donate Blood
              </Link>

              <Link
                to="/register/blood-bank"
                className={navLinkClass(isActive("/register/blood-bank"))}
              >
                <Building2 size={15} /> For Blood Banks
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
            </>
          )}
        </nav>

        {/* ========================================================================= */}
        {/* DESKTOP ACTION CONTROLS & AUTH STATUS                                    */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* A. Role-Specific Action Button */}
          {isAdmin && (
            <Button 
              asChild 
              variant="outline" 
              size="sm" 
              className="border-purple-700/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 font-semibold gap-1.5 shadow-sm"
            >
              <Link to="/admin/dashboard">
                <ShieldCheck size={15} className="text-purple-400" /> Console
              </Link>
            </Button>
          )}

          {isBank && (
            <Button 
              asChild 
              size="sm" 
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1.5 shadow-sm shadow-teal-950/40"
            >
              <Link to="/bank/dashboard?action=add-batch">
                <Plus size={15} /> Add Stock Batch
              </Link>
            </Button>
          )}

          {(isUser || isGuest) && (
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
          )}

          {/* B. Auth Status / Profile Badge */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              <Link 
                to={dashboardPath}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
                title="Go to Dashboard"
              >
                <Avatar
                  src={user.profile_picture_url}
                  name={user.name}
                  size="sm"
                  className={
                    isAdmin
                      ? "border-purple-600/70"
                      : isBank
                      ? "border-teal-600/70"
                      : "border-[var(--primary)]/70"
                  }
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[var(--foreground)] leading-tight max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <Badge variant="solid" className="text-[9px] py-0 px-1 bg-purple-700 text-white">
                        Super Admin
                      </Badge>
                    )}
                    {isBank && (
                      <Badge variant="solid" className="text-[9px] py-0 px-1 bg-teal-600 text-white">
                        Blood Bank
                      </Badge>
                    )}
                    {isUser && (
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

        {/* ========================================================================= */}
        {/* MOBILE CONTROLS: ACTION SHORTCUT + HAMBURGER DRAWER                       */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 md:hidden">
          {isAdmin ? (
            <Button asChild variant="outline" size="sm" className="px-2.5 py-1 text-xs border-purple-700 text-purple-300">
              <Link to="/admin/dashboard">
                <ShieldCheck size={13} /> Console
              </Link>
            </Button>
          ) : isBank ? (
            <Button asChild size="sm" className="px-2.5 py-1 text-xs bg-teal-600 text-white">
              <Link to="/bank/dashboard?action=add-batch">
                <Plus size={13} /> + Batch
              </Link>
            </Button>
          ) : (
            <Button asChild variant="destructive" size="sm" className="px-2.5 py-1 text-xs">
              <Link to="/request">
                <Siren size={13} /> Request
              </Link>
            </Button>
          )}

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
                    {user ? (
                      <Avatar
                        src={user.profile_picture_url}
                        name={user.name}
                        size="md"
                        className={
                          isAdmin
                            ? "border-purple-600/70"
                            : isBank
                            ? "border-teal-600/70"
                            : "border-[var(--primary)]/70"
                        }
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold bg-[var(--primary)]">
                        <Droplet size={18} />
                      </div>
                    )}
                    <div>
                      {user ? (
                        <>
                          <p className="text-sm font-bold text-[var(--foreground)]">{user.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[180px]">{user.email}</p>
                          <Badge 
                            variant="solid" 
                            className={`mt-1 text-[9px] py-0 px-1.5 uppercase font-semibold ${
                              isAdmin 
                                ? "bg-purple-700 text-white" 
                                : isBank 
                                ? "bg-teal-600 text-white" 
                                : "bg-[var(--color-brand-subtle)] text-[var(--primary)] border border-[var(--color-brand-border)]"
                            }`}
                          >
                            {isAdmin ? "Administrator" : isBank ? "Blood Bank Facility" : "Patient / Donor"}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-[var(--foreground)]">Smart Blood Bank</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Healthcare Supply Network</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links — strictly partitioned by role */}
                  <div className="flex flex-col space-y-1">

                    {/* 1. Mobile Links for Admin */}
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/dashboard?tab=overview"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/admin/dashboard"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Activity size={16} className="text-purple-400" /> System Overview
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/admin/dashboard?tab=banks"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/admin/dashboard", "tab=banks"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Building2 size={16} className="text-purple-400" /> Facility Verifications
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/admin/dashboard?tab=donors"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/admin/dashboard", "tab=donors"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <HeartHandshake size={16} className="text-purple-400" /> Donor Verifications
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/admin/dashboard?tab=users"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/admin/dashboard", "tab=users"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Users size={16} className="text-purple-400" /> User Governance
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/search"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/search"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Search size={16} className="text-purple-400" /> Audit Inventory Stock
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>
                      </>
                    )}

                    {/* 2. Mobile Links for Blood Bank */}
                    {isBank && (
                      <>
                        <Link
                          to="/bank/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/bank/dashboard"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <LayoutDashboard size={16} className="text-teal-400" /> Facility Dashboard
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/bank/dashboard?section=inventory"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/bank/dashboard", "section=inventory"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Boxes size={16} className="text-teal-400" /> Manage Blood Stock
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/bank/dashboard?section=requests"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/bank/dashboard", "section=requests"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <FileText size={16} className="text-teal-400" /> Incoming Requisitions
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/bank/dashboard?action=add-batch"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-teal-300 bg-teal-950/40 border border-teal-800/60"
                        >
                          <span className="flex items-center gap-2.5">
                            <Plus size={16} className="text-teal-400" /> + Add Inventory Batch
                          </span>
                          <ChevronRight size={15} className="text-teal-400" />
                        </Link>

                        <Link
                          to="/search"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/search"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Search size={16} className="text-teal-400" /> Search Network Stock
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>
                      </>
                    )}

                    {/* 3. Mobile Links for Normal User */}
                    {isUser && (
                      <>
                        <Link
                          to="/search"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/search"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Search size={16} className="text-[var(--primary)]" /> Find Blood
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

                        <Link
                          to="/donate"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/donate"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <HeartHandshake size={16} className="text-[var(--primary)]" /> Donate Blood
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/dashboard"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <ShieldCheck size={16} className="text-[var(--primary)]" /> My Portal &amp; Activity
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

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
                      </>
                    )}

                    {/* 4. Mobile Links for Guest */}
                    {isGuest && (
                      <>
                        <Link
                          to="/search"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/search"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Search size={16} className="text-[var(--primary)]" /> Find Blood Availability
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

                        <Link
                          to="/donor/register"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/donor/register"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <HeartHandshake size={16} className="text-[var(--primary)]" /> Become a Donor
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

                        <Link
                          to="/register/blood-bank"
                          onClick={() => setMenuOpen(false)}
                          className={drawerLinkClass(isActive("/register/blood-bank"))}
                        >
                          <span className="flex items-center gap-2.5">
                            <Building2 size={16} className="text-[var(--primary)]" /> Blood Bank Registration
                          </span>
                          <ChevronRight size={15} className="text-[var(--muted-foreground)]" />
                        </Link>

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
                      </>
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