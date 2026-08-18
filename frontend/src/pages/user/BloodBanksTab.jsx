// src/pages/user/BloodBanksTab.jsx

import { useState, useEffect } from "react";
import { listBloodBanks } from "../../services/bloodBankService";
import { haversineDistanceKm } from "../../utils/distance";

export default function BloodBanksTab() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    listBloodBanks().then((data) => setBanks(data.banks)).finally(() => setLoading(false));
  }, []);

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

  const sortedBanks = userLocation
    ? [...banks]
        .map((b) => ({
          ...b,
          distanceKm:
            b.latitude != null && b.longitude != null
              ? haversineDistanceKm(userLocation.lat, userLocation.lng, parseFloat(b.latitude), parseFloat(b.longitude))
              : null,
        }))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    : banks;

  if (loading) return <p className="text-sm text-[var(--color-slate)]">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">Blood banks</h2>
        <button
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-full border border-[var(--color-mist)] px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] disabled:opacity-60"
        >
          {locating ? "Locating…" : userLocation ? "📍 Nearest first" : "Find nearest"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {sortedBanks.length === 0 && <p className="text-sm text-[var(--color-slate)]">No blood banks registered yet.</p>}
        {sortedBanks.map((bank) => (
          <div key={bank.id} className="flex items-center justify-between rounded-xl border border-[var(--color-mist)] bg-white p-4">
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
          </div>
        ))}
      </div>
    </div>
  );
}