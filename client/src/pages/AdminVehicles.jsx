import { useEffect, useState } from "react";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

// Protected admin route: /admin/vehicles - the listing approval queue.
export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/admin/vehicles").then((res) => setVehicles(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function setApproval(vehicle, approved) {
    await api.put(`/admin/vehicles/${vehicle.id}`, { is_approved: approved });
    load();
  }

  if (loading) return <LoadingSpinner label="Loading listings..." />;

  return (
    <div className="section-wrap py-section">
      <h1 className="mb-gutter-lg text-3xl">Review vehicle listings</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-navy/5 text-xs uppercase text-brand-navy/60">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Rate/day</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/10">
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3">{v.make} {v.model} ({v.year})</td>
                <td className="px-4 py-3">{v.owner_name}</td>
                <td className="px-4 py-3">{v.location}</td>
                <td className="px-4 py-3">KES {Number(v.daily_rate).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${v.is_approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {v.is_approved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="space-x-2 px-4 py-3">
                  {!v.is_approved ? (
                    <button onClick={() => setApproval(v, true)} className="text-accent hover:underline">Approve</button>
                  ) : (
                    <button onClick={() => setApproval(v, false)} className="text-red-600 hover:underline">Reject</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
