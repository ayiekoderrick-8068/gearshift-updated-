import { useEffect, useState } from "react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

// Protected route: /dashboard - the owner's command centre for incoming
// booking requests on cars they've listed.
export default function OwnerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/bookings/owner").then((res) => setBookings(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function setStatus(id, status) {
    await api.put(`/bookings/${id}`, { status });
    load();
  }

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  return (
    <div className="section-wrap py-section">
      <h1 className="mb-gutter-lg text-3xl">Owner dashboard</h1>

      {bookings.length === 0 ? (
        <div className="card p-section text-center text-brand-navy/60">
          No booking requests yet for your listings.
        </div>
      ) : (
        <div className="space-y-gutter">
          {bookings.map((b) => (
            <div key={b.id} className="card flex flex-col gap-gutter p-gutter sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-semibold">{b.vehicle_make} {b.vehicle_model}</p>
                <p className="text-sm text-brand-navy/60">Renter: {b.renter_name}</p>
                <p className="text-sm text-brand-navy/60">{b.start_date} &rarr; {b.end_date}</p>
                <p className="text-sm font-semibold text-accent">KES {Number(b.total_price).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-gutter">
                <StatusBadge status={b.status} />

                {b.status === "pending" && (
                  <>
                    <button onClick={() => setStatus(b.id, "confirmed")} className="btn-primary py-2 text-sm">Confirm</button>
                    <button onClick={() => setStatus(b.id, "cancelled")} className="btn-secondary py-2 text-sm">Decline</button>
                  </>
                )}

                {b.status === "confirmed" && (
                  <button onClick={() => setStatus(b.id, "completed")} className="btn-secondary py-2 text-sm">Mark as completed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
