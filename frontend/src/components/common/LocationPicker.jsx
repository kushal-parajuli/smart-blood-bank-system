// src/components/common/LocationPicker.jsx
//
// Reusable across every "pick a location" need in the app (donor profile,
// blood bank registration later). Three ways to set a location, matching
// the plan: type an address and search, click/drag a pin on the map, or
// use the browser's live geolocation.
//
// Uses OpenStreetMap's free Nominatim geocoding API for address search —
// no API key or billing required (unlike Google Maps), which fits the
// project's hardware/cost constraints. Worth noting: Nominatim is a free
// public service with fair-use rate limits — fine for this project's
// scale, but not something to hammer with rapid repeated requests.

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon breaks under Vite's bundler unless
// explicitly reconfigured — loading the icon images from a CDN sidesteps
// that entirely rather than fighting Vite's asset resolution.
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [27.7172, 85.324]; // Kathmandu — reasonable default for this project

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

/**
 * @param {{lat: number, lng: number} | null} value
 * @param {(location: {lat: number, lng: number, address?: string, city?: string, district?: string, province?: string}) => void} onSelect
 */
export default function LocationPicker({ value, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [geoError, setGeoError] = useState("");

  const position = value ? [value.lat, value.lng] : null;

  // Turns a Nominatim "address" breakdown into the fields our form
  // actually has. OSM data granularity varies by area, so several
  // possible field names are tried for each — this is normal when
  // working with real-world geocoding data, not a sign of a bug.
  function parseAddressParts(address = {}) {
    return {
      city: address.city || address.town || address.village || address.county || "",
      district: address.state_district || address.county || "",
      province: address.state || "",
    };
  }

  async function reverseGeocode(lat, lng) {
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const parts = parseAddressParts(data.address);
      onSelect({ lat, lng, address: data.display_name, ...parts });
    } catch {
      // Reverse geocoding failing shouldn't block the person from
      // continuing — they can still type the address fields manually.
      onSelect({ lat, lng });
    } finally {
      setResolving(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setGeoError("Address search failed — you can still click directly on the map.");
    } finally {
      setSearching(false);
    }
  }

  function selectResult(result) {
    const parts = parseAddressParts(result.address);
    onSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      ...parts,
    });
    setResults([]);
    setQuery(result.display_name);
  }

  function useMyLocation() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => reverseGeocode(pos.coords.latitude, pos.coords.longitude),
      () => setGeoError("Couldn't get your location — please allow location access, or pick manually on the map."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an address…"
          className="flex-1 rounded-lg border border-[var(--color-mist)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg border border-[var(--color-brand)] px-3 py-2 text-sm font-medium text-[var(--color-brand)] disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={resolving}
          className="whitespace-nowrap rounded-lg bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {resolving ? "Locating…" : "Use my location"}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[var(--color-mist)] bg-white text-sm">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => selectResult(r)}
                className="block w-full px-3 py-2 text-left hover:bg-[var(--color-paper)]"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {geoError && <p className="mt-2 text-xs text-[var(--color-urgent)]">{geoError}</p>}

      <div className="mt-3 h-64 overflow-hidden rounded-xl border border-[var(--color-mist)]">
        <MapContainer
          center={position || DEFAULT_CENTER}
          zoom={position ? 15 : 12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={reverseGeocode} />
          {position && <Marker position={position} icon={markerIcon} />}
          <RecenterOnChange position={position} />
        </MapContainer>
      </div>

      <p className="mt-1 text-xs text-[var(--color-slate)]">
        Search an address, click "Use my location," or click directly on the map to place the pin.
      </p>
      {value && (
        <p className="mt-1 font-[var(--font-mono)] text-xs text-[var(--color-slate)]">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}