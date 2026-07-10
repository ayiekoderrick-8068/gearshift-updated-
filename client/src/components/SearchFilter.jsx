import { useState } from "react";
import { KENYAN_CITIES, VEHICLE_CATEGORIES } from "../constants";

// Filter panel used on /vehicles. Keeps its own local input state and only
// tells the parent (VehiclesBrowse) about the filter once "Apply" is
// clicked - avoids re-fetching on every keystroke.
export default function SearchFilter({ onFilter }) {
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");

  function handleApply() {
    const params = {};
    if (location) params.location = location;
    if (category) params.category = category;
    if (minRate) params.min_rate = minRate;
    if (maxRate) params.max_rate = maxRate;
    onFilter(params);
  }

  function handleReset() {
    setLocation("");
    setCategory("");
    setMinRate("");
    setMaxRate("");
    onFilter({});
  }

  return (
    <div className="card space-y-gutter p-gutter">
      <h3 className="font-display text-base font-semibold">Filter cars</h3>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-navy/60">Location</label>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field">
          <option value="">Any city</option>
          {KENYAN_CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-brand-navy/60">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
          <option value="">Any category</option>
          {VEHICLE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-brand-navy/60">Min KES/day</label>
          <input type="number" min="0" value={minRate} onChange={(e) => setMinRate(e.target.value)} className="input-field" placeholder="0" />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-brand-navy/60">Max KES/day</label>
          <input type="number" min="0" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} className="input-field" placeholder="10000" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleApply} className="btn-primary flex-1">Apply</button>
        <button onClick={handleReset} className="btn-secondary flex-1">Reset</button>
      </div>
    </div>
  );
}
