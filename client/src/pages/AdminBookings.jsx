import { useEffect, useState } from "react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

// Protected admin route: /admin/bookings - system-wide view for resolving disputes.
export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/admin/bookings").then((res) => setBookings(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  // Reuses PUT /bookings/:id - the backend grants admins a full override
  // there (see server/routes/bookings.py update_booking), so admins can
  // approve/decline a pending request directly, or force-cancel a
  // confirmed/active one to resolve a dispute, without going through the
  // normal owner/renter state machine.
  async function setStatus(id, status, confirmMessage) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    try {
      await api.put(`/bookings/${id}`, { status });
    } catch {
      alert("Could not update this booking.");
    }
    load();
  }

  if (loading) return <LoadingSpinner label="Loading bookings..." />;

  return (
    <div className="section-wrap py-section">
      <h1 className="mb-gutter-lg text-3xl">All bookings</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-navy/5 text-xs uppercase text-brand-navy/60">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Renter</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/10">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">{b.vehicle_make} {b.vehicle_model}</td>
                <td className="px-4 py-3">{b.renter_name}</td>
                <td className="px-4 py-3">{b.start_date} &rarr; {b.end_date}</td>
                <td className="px-4 py-3">KES {Number(b.total_price).toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="space-x-3 px-4 py-3">
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => setStatus(b.id, "confirmed")}
                        className="text-accent hover:underline"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setStatus(b.id, "cancelled", "Decline this booking request?")}
                        className="text-red-600 hover:underline"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {(b.status === "confirmed" || b.status === "active") && (
                    <button
                      onClick={() => setStatus(b.id, "cancelled", "Force cancel this booking?")}
                      className="text-red-600 hover:underline"
                    >
                      Force cancel
                    </button>
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
