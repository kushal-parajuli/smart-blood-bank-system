// src/pages/SearchBlood.jsx
//
// Fully public — no login required, matching the project's design
// (finding blood shouldn't have a login wall). Optionally uses live
// location to sort results by distance, but works perfectly fine
// without it too.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchAvailability } from "../services/inventoryService";
import { haversineDistanceKm } from "../utils/distance";
import { useAuth } from "../context/AuthContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SearchBlood() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
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

  async function handleSearch(e) {
    e.preventDefault();
    if (!bloodGroup) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchAvailability({ bloodGroup, city: city || undefined });
      setResults(data.results);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Please try again.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleRequestClick(bank) {
    if (!user) {
      // Send them to log in first — after logging in they'd land back
      // on /request with no context, so simplest honest behavior here
      // is just to require login before this action, same as the
      // regular "Request blood" flow already does via ProtectedRoute.
      navigate("/login");
      return;
    }
    navigate("/request", {
      state: {
        presetBloodGroup: bloodGroup,
        presetBankId: bank.blood_bank_id,
        presetBankName: bank.bank_name,
      },
    });
  }

  // Attach distance to each result (when we have the user's location)
  // and sort nearest-first — otherwise fall back to the backend's own
  // ordering (highest stock first).
  const displayResults = (() => {
    if (!results) return null;
    if (!userLocation) return results;
    return [...results]
      .map((r) => ({
        ...r,
        distanceKm:
          r.latitude != null && r.longitude != null
            ? haversineDistanceKm(userLocation.lat, userLocation.lng, parseFloat(r.latitude), parseFloat(r.longitude))
            : null,
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  })();

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
        Search blood availability
      </h1>
      <p className="mt-1 text-sm text-[var(--color-slate)]">
        Find which blood banks currently have your blood group in stock.
      </p>

      <form onSubmit={handleSearch} className="mt-8 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Blood group</label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            required
            className="rounded-lg border border-[var(--color-mist)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          >
            <option value="" disabled>Select…</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
            City <span className="text-[var(--color-slate)] font-normal">(optional)</span>
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Kathmandu"
            className="rounded-lg border border-[var(--color-mist)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-full border border-[var(--color-mist)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] disabled:opacity-60"
        >
          {locating ? "Locating…" : userLocation ? "📍 Sorting by distance" : "Sort by distance"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-[var(--color-urgent)]">{error}</p>}

      <div className="mt-8 space-y-3">
        {displayResults === null && !loading && (
          <p className="text-sm text-[var(--color-slate)]">Select a blood group and search to see results.</p>
        )}

        {displayResults?.length === 0 && (
          <p className="text-sm text-[var(--color-slate)]">
            No blood banks currently have this blood group in stock.
          </p>
        )}

        {displayResults?.map((bank) => (
          <div
            key={bank.blood_bank_id}
            className="flex items-center justify-between rounded-xl border border-[var(--color-mist)] bg-white p-5"
          >
            <div>
              <p className="font-semibold text-[var(--color-ink)]">
                {bank.bank_name}
                {!!bank.is_verified_by_admin && (
                  <span className="ml-2 rounded-full bg-[var(--color-brand-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand-dark)]">
                    Verified
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-[var(--color-slate)]">
                {bank.city}{bank.district ? `, ${bank.district}` : ""}
                {bank.distanceKm != null && ` · ${bank.distanceKm.toFixed(1)} km away`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-[var(--font-mono)] text-xl font-semibold text-[var(--color-brand)]">
                {bank.total_units}
              </p>
              <p className="text-xs text-[var(--color-slate)]">units available</p>
              <button
                onClick={() => handleRequestClick(bank)}
                className="mt-2 rounded-full bg-[var(--color-brand)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-brand-dark)]"
              >
                Request this
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}