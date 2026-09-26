// src/pages/SearchBlood.jsx
// Healthcare blood inventory discovery console.
// Results render directly on the main screen above secondary location filters
// to eliminate manual scrolling friction during time-sensitive queries.

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  ShieldCheck,
  Droplet,
  ArrowRight,
  RotateCcw,
  Building2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { searchAvailability } from "../services/inventoryService";
import { haversineDistanceKm } from "../utils/distance";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SearchBlood() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [searchedGroup, setSearchedGroup] = useState("");

  const executeSearch = useCallback(async (targetGroup, targetCity) => {
    if (!targetGroup) return;

    setLoading(true);
    setError("");
    setSearchedGroup(targetGroup);

    try {
      const data = await searchAvailability({ 
        bloodGroup: targetGroup, 
        city: targetCity ? targetCity.trim() : undefined 
      });
      setResults(data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Please verify your network and try again.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle URL query parameters on initial load (e.g. from Home page quick search)
  useEffect(() => {
    const urlGroup = searchParams.get("blood_group");
    const urlDistrict = searchParams.get("district") || searchParams.get("city");
    
    if (urlGroup) {
      setBloodGroup(urlGroup);
      if (urlDistrict) setCity(urlDistrict);
      executeSearch(urlGroup, urlDistrict);
    }
  }, [searchParams, executeSearch]);

  function handleSelectGroup(group) {
    setBloodGroup(group);
    executeSearch(group, city);
  }

  function handleFormSubmit(e) {
    if (e) e.preventDefault();
    if (!bloodGroup) return;
    executeSearch(bloodGroup, city);
  }

  function useMyLocation() {
    if (userLocation) {
      setUserLocation(null);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleRequestClick(bank) {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/request", {
      state: {
        presetBloodGroup: searchedGroup || bloodGroup,
        presetBankId: bank.blood_bank_id,
        presetBankName: bank.bank_name,
      },
    });
  }

  function handleReset() {
    setBloodGroup("");
    setCity("");
    setResults(null);
    setError("");
    setUserLocation(null);
    setSearchedGroup("");
  }

  // Attach distance to each result if GPS active
  const displayResults = (() => {
    if (!results) return null;
    if (!userLocation) return results;
    return [...results]
      .map((r) => ({
        ...r,
        distanceKm:
          r.latitude != null && r.longitude != null
            ? haversineDistanceKm(
                userLocation.lat,
                userLocation.lng,
                parseFloat(r.latitude),
                parseFloat(r.longitude)
              )
            : null,
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  })();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* COMPACT PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="gap-1.5 border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-brand-hover)]"
              >
                <Droplet size={12} className="text-[var(--primary)] fill-current" />
                Live Transfusion Directory
              </Badge>
              {bloodGroup && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Target: <strong className="text-[var(--primary)] font-mono">{bloodGroup}</strong>
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Search Blood Availability
            </h1>
          </div>

          {(bloodGroup || city || results !== null || userLocation) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="self-start sm:self-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-white"
            >
              <RotateCcw size={13} />
              Reset filters
            </Button>
          )}
        </div>

        {/* TOP QUICK BLOOD GROUP SELECTOR BAR */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Select Blood Group (Click to instant search)
            </span>
            {bloodGroup && (
              <span className="text-xs font-medium text-[var(--primary)]">
                Active Group: <span className="font-bold font-mono">{bloodGroup}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {BLOOD_GROUPS.map((group) => {
              const isSelected = bloodGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => handleSelectGroup(group)}
                  className={`flex h-11 flex-col items-center justify-center rounded-lg border text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-md shadow-teal-900/40 scale-[1.03]"
                      : "border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--foreground)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  <span className="font-mono text-base">{group}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        {/* ========================================================================= */}
        {/* RESULTS FEED — RENDERED DIRECTLY AT THE TOP ON MAIN SCREEN WITHOUT SCROLL */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          
          {/* 1. INITIAL PROMPT WHEN NO GROUP SELECTED YET */}
          {displayResults === null && !loading && (
            <Card variant="subtle" className="border-dashed border-[var(--border)] p-6 sm:p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--primary)] mb-3">
                <Search size={20} />
              </div>
              <h3 className="font-heading text-base font-bold text-[var(--foreground)]">
                Select a blood group above to view live inventory
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-[var(--muted-foreground)]">
                Matching verified transfusion centers and available unit reserves will appear right here instantly.
              </p>
            </Card>
          )}

          {/* 2. LOADING SKELETON */}
          {loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] animate-pulse">
                <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
                Querying verified transfusion centers for {bloodGroup}...
              </div>
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse border-[var(--border)] bg-[var(--card)] p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="space-y-2">
                      <div className="h-5 w-48 rounded bg-[var(--color-line-subtle)]" />
                      <div className="h-4 w-32 rounded bg-[var(--color-line-subtle)]" />
                    </div>
                    <div className="h-9 w-28 rounded bg-[var(--color-line-subtle)]" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 3. NO RESULTS EMPTY STATE */}
          {displayResults !== null && displayResults.length === 0 && !loading && (
            <Card variant="default" className="border-red-900/40 bg-red-950/20 p-6 sm:p-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-900/40 text-red-400 mb-3">
                <AlertCircle size={22} />
              </div>
              <h3 className="font-heading text-lg font-bold text-[var(--foreground)]">
                No verified units currently in stock
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-[var(--muted-foreground)]">
                None of the verified transfusion centers report ready batches of{" "}
                <span className="font-mono font-bold text-[var(--primary)]">
                  {searchedGroup || bloodGroup}
                </span>
                {city ? ` in "${city}"` : ""}.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="destructive"
                  onClick={() =>
                    navigate("/request", {
                      state: { presetBloodGroup: searchedGroup || bloodGroup },
                    })
                  }
                  className="w-full sm:w-auto gap-2 font-semibold"
                >
                  Submit Emergency Blood Requisition
                  <ArrowRight size={14} />
                </Button>
                {city && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCity("");
                      executeSearch(bloodGroup, "");
                    }}
                    className="w-full sm:w-auto text-xs"
                  >
                    Clear city filter &amp; search nationwide
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 4. ACTIVE RESULTS LIST (TOP OF SCREEN) */}
          {displayResults !== null && displayResults.length > 0 && !loading && (
            <div className="space-y-3">
              {/* Results Meta Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--muted-foreground)]">
                <span className="font-medium">
                  Found <strong className="text-[var(--foreground)] font-mono">{displayResults.length}</strong> verified{" "}
                  {displayResults.length === 1 ? "bank" : "banks"} with{" "}
                  <strong className="text-[var(--primary)] font-mono">
                    {searchedGroup || bloodGroup}
                  </strong>{" "}
                  in stock
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <SlidersHorizontal size={12} />
                  {userLocation ? "Sorted by closest GPS proximity" : "Sorted by highest available stock"}
                </span>
              </div>

              {/* Matching Facility Cards */}
              <AnimatePresence mode="popLayout">
                {displayResults.map((bank, index) => (
                  <motion.div
                    key={bank.blood_bank_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2) }}
                  >
                    <Card className="border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--color-brand)]/50 transition-all shadow-sm">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        
                        {/* Facility Details */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Building2 size={18} className="text-[var(--primary)] shrink-0" />
                            <h3 className="font-heading text-base font-bold text-[var(--foreground)] sm:text-lg">
                              {bank.bank_name}
                            </h3>
                            {!!bank.is_verified_by_admin && (
                              <Badge
                                variant="outline"
                                className="gap-1 border-emerald-800/60 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-400"
                              >
                                <ShieldCheck size={12} className="text-emerald-400" />
                                Verified
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="shrink-0 text-[var(--primary)]" />
                              {bank.city}
                              {bank.district ? `, ${bank.district}` : ""}
                              {bank.province ? ` (${bank.province})` : ""}
                            </span>

                            {bank.distanceKm != null && (
                              <span className="flex items-center gap-1 font-semibold text-[var(--primary)]">
                                <Navigation size={12} className="shrink-0 fill-current" />
                                {bank.distanceKm.toFixed(1)} km away
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock & Requisition Action */}
                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-baseline gap-1 sm:justify-end">
                              <span className="font-mono text-2xl font-extrabold text-[var(--primary)] sm:text-3xl">
                                {bank.total_units}
                              </span>
                              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                                {Number(bank.total_units) === 1 ? "unit" : "units"}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--muted-foreground)]">Available right now</p>
                          </div>

                          <Button
                            onClick={() => handleRequestClick(bank)}
                            size="sm"
                            className="mt-2 gap-1.5 shadow-sm font-semibold"
                          >
                            <span>Request this</span>
                            <ArrowRight size={14} />
                          </Button>
                        </div>

                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* SECONDARY LOCATION & PROXIMITY FILTERS — PLACED BELOW RESULTS             */}
        {/* ========================================================================= */}
        <Card variant="subtle" className="border-[var(--border)] p-4 sm:p-5">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Refine by Location &amp; Distance (Optional)
              </span>
              {city && (
                <span className="text-xs text-[var(--primary)] font-medium">
                  Filtering city: &quot;{city}&quot;
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              {/* City Input */}
              <div className="relative sm:col-span-7">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
                  <MapPin size={16} />
                </div>
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Filter by city (e.g. Kathmandu, Pokhara)"
                  className="pl-9 bg-[var(--color-surface)] border-[var(--border)]"
                />
                {city && (
                  <button
                    type="button"
                    onClick={() => {
                      setCity("");
                      if (bloodGroup) executeSearch(bloodGroup, "");
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-[var(--muted-foreground)] hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Distance Sort Toggle Button */}
              <div className="sm:col-span-5">
                <Button
                  type="button"
                  variant={userLocation ? "default" : "outline"}
                  onClick={useMyLocation}
                  disabled={locating}
                  className="w-full gap-2 text-xs font-medium h-10"
                >
                  {locating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Detecting GPS...
                    </>
                  ) : userLocation ? (
                    <>
                      <Navigation size={13} className="fill-current" />
                      Proximity Sorted (GPS Active)
                    </>
                  ) : (
                    <>
                      <Navigation size={13} />
                      Sort by Distance (GPS)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {city && (
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" disabled={loading || !bloodGroup} className="gap-1.5 text-xs font-semibold">
                  <Search size={13} /> Apply City Filter
                </Button>
              </div>
            )}
          </form>
        </Card>

      </div>
    </div>
  );
}