import { useEffect, useState } from "react";
import api from "../api";
import RatingStars from "./RatingStars";

// Self-drive vs chauffeur-driven hire picker. Shared by BookingNew.jsx
// (single vehicle) and EventBooking.jsx (one of these per vehicle in a
// convoy) - written once here instead of duplicated in both places (DRY).
//
// Fully controlled component: the parent owns hireType/driverId state and
// passes them in along with setters, so it can read the current selection
// to compute a live price preview.
//
// excludeDriverIds - used by EventBooking.jsx: a driver already assigned to
// a DIFFERENT vehicle in the same convoy can't be picked again here (one
// person can't chauffeur two cars at once). Defaults to an empty array so
// BookingNew.jsx (a single vehicle, nothing to exclude) doesn't need to
// pass anything.
export default function DriverPicker({ hireType, setHireType, driverId, setDriverId, excludeDriverIds = [] }) {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    api.get("/drivers").then((res) => setDrivers(res.data)).catch(() => setDrivers([]));
  }, []);

  const availableDrivers = drivers.filter((d) => !excludeDriverIds.includes(d.id));

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Hire type</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setHireType("self_drive"); setDriverId(null); }}
          className={`flex-1 rounded-card border px-3 py-2 text-sm transition ${
            hireType === "self_drive" ? "border-accent bg-accent/10 font-medium text-accent" : "border-brand-navy/15"
          }`}
        >
          Self-drive
        </button>
        <button
          type="button"
          onClick={() => setHireType("chauffeur")}
          className={`flex-1 rounded-card border px-3 py-2 text-sm transition ${
            hireType === "chauffeur" ? "border-accent bg-accent/10 font-medium text-accent" : "border-brand-navy/15"
          }`}
        >
          With driver
        </button>
      </div>

      {hireType === "chauffeur" && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium">Choose a driver</label>
          <select
            required
            value={driverId || ""}
            onChange={(e) => setDriverId(Number(e.target.value))}
            className="input-field"
          >
            <option value="" disabled>Select a driver...</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} - {d.rating.toFixed(1)}/5 - KES {Number(d.daily_rate).toLocaleString()}/day
              </option>
            ))}
          </select>
          {excludeDriverIds.length > 0 && (
            <p className="mt-1 text-xs text-brand-navy/50">
              Drivers already assigned to another vehicle in this convoy aren't shown - one driver can't be in two cars at once.
            </p>
          )}
          {/* Small preview of the selected driver's rating as stars, since
              the <option> text above can't render styled stars itself. */}
          {driverId && drivers.find((d) => d.id === driverId) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-brand-navy/60">
              <RatingStars rating={drivers.find((d) => d.id === driverId).rating} size="text-sm" />
              <span>Higher-rated drivers cost more per day.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
