import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import DriverPicker from "../components/DriverPicker";
import {
  EVENT_TYPES,
  EVENT_SUGGESTED_CATEGORIES,
  EVENT_THEMES,
  previewConvoyDiscount,
  isValidKenyanPhone,
} from "../constants";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=300&q=60";

// Protected route: /events/new - book several vehicles at once for a
// wedding, funeral, safari, or group transportation event, with a volume
// discount that scales with how many vehicles are in the convoy (see
// previewConvoyDiscount and the matching CONVOY_DISCOUNT_TIERS on the
// backend, which is the source of truth - this page only shows a preview).
export default function EventBooking() {
  const navigate = useNavigate();

  const [eventType, setEventType] = useState("wedding");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // selections: { [vehicleId]: { hireType: "self_drive"|"chauffeur", driverId: number|null } }
  const [selections, setSelections] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingVehicles(true);
    api.get("/vehicles").then((res) => setVehicles(res.data)).finally(() => setLoadingVehicles(false));
  }, []);

  // Reset selections whenever the event type changes - a vehicle picked
  // for "wedding" showing up mid-selection when switching to "safari"
  // would be confusing (and likely the wrong kind of vehicle anyway).
  useEffect(() => {
    setSelections({});
  }, [eventType]);

  const theme = EVENT_THEMES[eventType] || EVENT_THEMES.other;
  const suggestedCategories = EVENT_SUGGESTED_CATEGORIES[eventType] || [];

  // Strict filter by default (only the categories suggested for this event
  // type) - "Browse all categories" is the escape hatch. Within the
  // filtered set, sort so the FIRST category in the suggested list (the
  // one this event is actually about - Limousine for a wedding, Hearse for
  // a funeral, Safari for a safari, Bus for group transport) appears
  // before everything else, instead of database order.
  const visibleVehicles = useMemo(() => {
    const pool = showAllCategories
      ? vehicles
      : vehicles.filter((v) => suggestedCategories.includes(v.category));

    return [...pool].sort((a, b) => {
      const aRank = suggestedCategories.indexOf(a.category);
      const bRank = suggestedCategories.indexOf(b.category);
      return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
    });
  }, [vehicles, suggestedCategories, showAllCategories]);

  const selectedIds = Object.keys(selections).map(Number);
  const selectedVehicles = vehicles.filter((v) => selectedIds.includes(v.id));

  function toggleVehicle(vehicle) {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[vehicle.id]) {
        delete next[vehicle.id];
      } else {
        next[vehicle.id] = { hireType: "self_drive", driverId: null };
      }
      return next;
    });
  }

  function updateSelection(vehicleId, patch) {
    setSelections((prev) => ({ ...prev, [vehicleId]: { ...prev[vehicleId], ...patch } }));
  }

  // Driver IDs already claimed by OTHER vehicles in this convoy - passed to
  // each DriverPicker as excludeDriverIds so the same chauffeur can't be
  // picked twice (see the comment in DriverPicker.jsx).
  function driverIdsUsedByOthers(currentVehicleId) {
    return Object.entries(selections)
      .filter(([vid, sel]) => Number(vid) !== currentVehicleId && sel.hireType === "chauffeur" && sel.driverId)
      .map(([, sel]) => sel.driverId);
  }

  const days =
    startDate && endDate
      ? Math.max(0, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)))
      : 0;

  // Live price preview - the backend recalculates authoritatively on
  // submit, this is just so the discount doesn't feel like a mystery.
  const { subtotal, discount, total } = useMemo(() => {
    if (days <= 0) return { subtotal: 0, discount: 0, total: 0 };
    let sub = 0;
    for (const v of selectedVehicles) {
      sub += days * v.daily_rate;
    }
    const disc = previewConvoyDiscount(selectedVehicles.length);
    return { subtotal: sub, discount: disc, total: sub * (1 - disc) };
  }, [selectedVehicles, days]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (selectedVehicles.length === 0) {
      setError("Select at least one vehicle for your convoy.");
      return;
    }
    if (!isValidKenyanPhone(contactPhone)) {
      setError("Enter a valid contact number in the format +254 followed by 9 digits, e.g. +254795038762.");
      return;
    }
    if (!disclaimerAccepted) {
      setError("You must accept the damage liability disclaimer to continue.");
      return;
    }
    for (const v of selectedVehicles) {
      if (selections[v.id].hireType === "chauffeur" && !selections[v.id].driverId) {
        setError(`Choose a driver for the ${v.make} ${v.model}, or switch it to self-drive.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post("/bookings/convoy", {
        event_type: eventType,
        start_date: startDate,
        end_date: endDate,
        notes,
        contact_phone: contactPhone,
        vehicles: selectedVehicles.map((v) => ({
          vehicle_id: v.id,
          hire_type: selections[v.id].hireType,
          driver_id: selections[v.id].hireType === "chauffeur" ? selections[v.id].driverId : null,
        })),
      });
      navigate("/bookings", { state: { success: true } });
    } catch (err) {
      setError(err.response?.data?.error || "Could not create this convoy booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Themed hero - a real photo background per event type (see
          EVENT_THEMES in constants.js) with a colour-tinted gradient
          overlay, so a client can tell wedding/funeral/safari/group
          transport/other apart at a glance without reading anything. The
          event-type + dates + phone "mini-form" floats over the bottom of
          the photo like a booking widget. */}
      <div
        className="relative overflow-hidden bg-cover"
        style={{ backgroundImage: `url(${theme.bgImage})`, backgroundPosition: theme.bgPosition || "center" }}
      >
        <div className={`absolute inset-0 ${theme.gradient}`} />

        <div className={`section-wrap relative py-section-lg ${theme.textClass}`}>
          <p className="text-5xl">{theme.emoji}</p>
          <h1 className="mt-2 max-w-xl text-3xl sm:text-4xl">{theme.heading}</h1>
          <p className="mt-2 max-w-lg opacity-90">{theme.body}</p>

          {/* Floating mini-form card */}
          <form onSubmit={handleSubmit} className="mt-gutter-lg w-full max-w-lg rounded-card bg-white/95 p-gutter text-brand-navy shadow-card backdrop-blur">
            {error && <p className="mb-gutter rounded-card bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

            <label className="mb-2 block text-sm font-medium">Event type</label>
            <div className="mb-gutter flex flex-wrap gap-2">
              {EVENT_TYPES.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setEventType(opt.value)}
                  className={`rounded-card border px-3 py-1.5 text-sm transition ${
                    eventType === opt.value ? "border-accent bg-accent/10 font-medium text-accent" : "border-brand-navy/15"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid gap-gutter sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Start date</label>
                <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End date</label>
                <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
              </div>
            </div>

            <div className="mt-gutter">
              <label className="mb-1 block text-sm font-medium">Contact phone number</label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+254795038762"
                pattern="^\+254\d{9}$"
                className="input-field"
              />
              <p className="mt-1 text-xs text-brand-navy/50">Format: +254 followed by 9 digits, e.g. +254795038762.</p>
            </div>
          </form>
        </div>
      </div>

      {/* Trust strip - same three highlights regardless of event type */}
      <div className="border-b border-brand-navy/10 bg-surface">
        <div className="section-wrap grid gap-gutter py-gutter-lg sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <p className="font-semibold">Bulk booking discount</p>
              <p className="text-sm text-brand-navy/60">The more you book, the more you save.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-semibold">Verified &amp; insured cars</p>
              <p className="text-sm text-brand-navy/60">Safe, reliable and chauffeur-driven.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎧</span>
            <div>
              <p className="font-semibold">Support</p>
              <p className="text-sm text-brand-navy/60">We're here to help you 24/7.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-wrap max-w-4xl py-section">
        <form onSubmit={handleSubmit} className="space-y-gutter-lg">
          {/* Notes - kept as its own small block below the hero form so the
              floating card above stays short. Submitting either form fires
              the same handleSubmit / state, since they share component state. */}
          <div className="card p-gutter-lg">
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="Venue, pickup point, special requests..." />
          </div>

          {/* Step 2: pick vehicles */}
          <div>
            <div className="mb-gutter flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {showAllCategories ? "All vehicles" : `${EVENT_TYPES.find((t) => t.value === eventType)?.label} vehicles`}
              </h2>
              <button
                type="button"
                onClick={() => setShowAllCategories((v) => !v)}
                className="text-sm font-medium text-accent hover:underline"
              >
                {showAllCategories ? "Show suggested only" : "Browse all categories"}
              </button>
            </div>

            {loadingVehicles ? (
              <LoadingSpinner label="Loading vehicles..." />
            ) : (
              <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
                {visibleVehicles.map((v) => {
                  const isSelected = Boolean(selections[v.id]);
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => toggleVehicle(v)}
                      className={`card flex items-center gap-3 p-3 text-left transition ${
                        isSelected ? "ring-2 ring-accent" : "hover:shadow-lg"
                      }`}
                    >
                      <img
                        src={v.image_url || FALLBACK_IMG}
                        alt=""
                        className="h-14 w-20 rounded-md object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{v.make} {v.model}</p>
                        <p className="text-xs text-brand-navy/50">{v.category} &middot; KES {Number(v.daily_rate).toLocaleString()}/day</p>
                      </div>
                      <span className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${isSelected ? "border-accent bg-accent" : "border-brand-navy/20"}`} />
                    </button>
                  );
                })}
                {visibleVehicles.length === 0 && (
                  <p className="col-span-full text-sm text-brand-navy/60">No vehicles in this category yet - try "Browse all categories".</p>
                )}
              </div>
            )}
          </div>

          {/* Step 3: configure each selected vehicle (self-drive vs driver) */}
          {selectedVehicles.length > 0 && (
            <div>
              <h2 className="mb-gutter text-lg font-semibold">Your convoy ({selectedVehicles.length} vehicles)</h2>
              <div className="space-y-gutter">
                {selectedVehicles.map((v) => (
                  <div key={v.id} className="card p-gutter">
                    <div className="mb-gutter flex items-center justify-between">
                      <p className="font-medium">{v.make} {v.model}</p>
                      <button type="button" onClick={() => toggleVehicle(v)} className="text-sm text-red-600 hover:underline">
                        Remove
                      </button>
                    </div>
                    <DriverPicker
                      hireType={selections[v.id].hireType}
                      setHireType={(val) => updateSelection(v.id, { hireType: val })}
                      driverId={selections[v.id].driverId}
                      setDriverId={(val) => updateSelection(v.id, { driverId: val })}
                      excludeDriverIds={driverIdsUsedByOthers(v.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price summary + discount preview */}
          {days > 0 && selectedVehicles.length > 0 && (
            <div className="card space-y-2 p-gutter-lg text-sm">
              <div className="flex justify-between">
                <span>{selectedVehicles.length} vehicle{selectedVehicles.length > 1 ? "s" : ""} &times; {days} day{days > 1 ? "s" : ""}</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Convoy discount ({Math.round(discount * 100)}% off)</span>
                  <span>-KES {(subtotal - total).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-brand-navy/10 pt-2 text-lg font-semibold text-accent">
                <span>Total</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              {discount === 0 && selectedVehicles.length === 1 && (
                <p className="text-xs text-brand-navy/50">Add another vehicle to unlock a convoy discount.</p>
              )}
            </div>
          )}

          {/* Damage liability disclaimer - required acknowledgement before submitting */}
          <label className="flex items-start gap-3 rounded-card bg-amber-50 p-gutter text-sm text-amber-900">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I understand that any damage to a vehicle during the rental period will be charged according to the
              extent of the damage, and that I - as the person making this booking - am responsible for that cost.
            </span>
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Booking your convoy..." : "Book this convoy"}
          </button>
        </form>
      </div>
    </div>
  );
}
