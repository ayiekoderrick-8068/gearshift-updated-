import { useEffect, useState } from "react";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

// Protected admin route: /admin/users
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/admin/users").then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleBan(user) {
    await api.put(`/admin/users/${user.id}`, { is_banned: !user.is_banned });
    load();
  }

  async function verify(user) {
    await api.put(`/admin/users/${user.id}`, { verification_status: "verified" });
    load();
  }

  async function remove(user) {
    if (!confirm(`Delete ${user.email}? This also deletes their listings and bookings.`)) return;
    await api.delete(`/admin/users/${user.id}`);
    load();
  }

  if (loading) return <LoadingSpinner label="Loading users..." />;

  return (
    <div className="section-wrap py-section">
      <h1 className="mb-gutter-lg text-3xl">Manage users</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-navy/5 text-xs uppercase text-brand-navy/60">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Banned</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/10">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 capitalize">{u.verification_status}</td>
                <td className="px-4 py-3">{u.is_banned ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{u.vehicle_count}</td>
                <td className="px-4 py-3">{u.booking_count}</td>
                <td className="space-x-2 px-4 py-3">
                  <button onClick={() => toggleBan(u)} className="text-accent hover:underline">
                    {u.is_banned ? "Unban" : "Ban"}
                  </button>
                  {u.verification_status !== "verified" && (
                    <button onClick={() => verify(u)} className="text-accent hover:underline">Verify</button>
                  )}
                  <button onClick={() => remove(u)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
