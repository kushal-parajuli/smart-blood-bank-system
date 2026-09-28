// src/pages/user/BloodBanksTab.jsx

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  ShieldCheck,
  Navigation,
  Loader2,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";
import { listBloodBanks } from "../../services/bloodBankService";
import { haversineDistanceKm } from "../../utils/distance";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import BloodBankPhoto from "../../components/bloodbank/BloodBankPhoto";
import BloodBankGalleryModal from "../../components/bloodbank/BloodBankGalleryModal";

export default function BloodBanksTab() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [galleryBank, setGalleryBank] = useState(null);

  useEffect(() => {
    listBloodBanks()
      .then((data) => setBanks(data.banks || []))
      .catch(() => setBanks([]))
      .finally(() => setLoading(false));
  }, []);

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

  const sortedBanks = userLocation
    ? [...banks]
        .map((b) => ({
          ...b,
          distanceKm:
            b.latitude != null && b.longitude != null
              ? haversineDistanceKm(
                  userLocation.lat,
                  userLocation.lng,
                  parseFloat(b.latitude),
                  parseFloat(b.longitude)
                )
              : null,
        }))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    : banks;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--card)] border border-[var(--border)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-[var(--font-display)] text-lg font-bold text-[var(--foreground)]">
            Registered Blood Banks
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Explore certified blood transfusion centers and donation facilities across Nepal.
          </p>
        </div>

        <Button
          type="button"
          variant={userLocation ? "default" : "outline"}
          size="sm"
          disabled={locating}
          onClick={useMyLocation}
          className="gap-2 text-xs self-start sm:self-center"
        >
          {locating ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Detecting GPS...
            </>
          ) : userLocation ? (
            <>
              <Navigation size={13} className="fill-current" /> Proximity Sorted
            </>
          ) : (
            <>
              <Navigation size={13} /> Sort by Distance (GPS)
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {sortedBanks.length === 0 ? (
          <Card className="border-dashed border-[var(--border)] bg-[var(--card)]/40 p-8 text-center text-xs text-[var(--muted-foreground)]">
            No blood banks currently registered in the database.
          </Card>
        ) : (
          sortedBanks.map((bank) => (
            <Card
              key={bank.id}
              className="border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 transition-all hover:border-[var(--primary)]/40 shadow-xs"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                  <BloodBankPhoto
                    src={bank.primary_image_url}
                    bankName={bank.bank_name}
                    className="w-20 h-16 sm:w-24 sm:h-20"
                    onViewGallery={() => setGalleryBank(bank)}
                    hasGallery={true}
                  />

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 size={16} className="text-[var(--primary)] shrink-0" />
                      <h3
                        onClick={() => setGalleryBank(bank)}
                        className="font-[var(--font-display)] text-base font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition cursor-pointer"
                        title="Click to view facility gallery"
                      >
                        {bank.bank_name}
                      </h3>
                      {!!bank.is_verified_by_admin && (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                        >
                          <ShieldCheck size={11} className="text-emerald-600" /> Verified Facility
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-[var(--primary)]" />
                        {bank.city}
                        {bank.district ? `, ${bank.district}` : ""}
                      </span>

                      {bank.distanceKm != null && (
                        <span className="font-semibold text-[var(--primary)] flex items-center gap-1">
                          <Navigation size={11} className="fill-current" />
                          {bank.distanceKm.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setGalleryBank(bank)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    View Photos
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs gap-1.5">
                    <Link to="/donate">
                      <HeartHandshake size={13} />
                      Donate
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="text-xs gap-1.5 shadow-xs">
                    <Link to="/search">
                      Check Stock
                      <ArrowRight size={13} />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* GALLERY MODAL */}
      <BloodBankGalleryModal
        bank={galleryBank}
        isOpen={Boolean(galleryBank)}
        onClose={() => setGalleryBank(null)}
      />
    </div>
  );
}