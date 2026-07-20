import { useEffect, useState } from "react";
import api from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

// Protected admin route: /admin/driver-applications - review CVs submitted
// via the public /become-a-driver form.
export default function AdminDriverApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get("/admin/driver-applications").then((res) => setApplications(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function setStatus(id, status) {
    await api.put(`/admin/driver-applications/${id}`, { status });
    load();
  }

  // The CV download goes through an authenticated endpoint (not a public
  // static file URL), so we can't just use a plain <a href>. Fetch it as a
  // blob with the auth header api.js already attaches, then trigger a
  // browser download from that blob.
  async function downloadCv(id, filename) {
    const res = await api.get(`/admin/driver-applications/${id}/cv`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "cv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  const statusStyle = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
  };

  if (loading) return <LoadingSpinner label="Loading applications..." />;

  return (
    <div className="section-wrap py-section">
      <h1 className="mb-gutter-lg text-3xl">Chauffeur applications</h1>

      {applications.length === 0 ? (
        <div className="card p-section text-center text-brand-navy/60">No applications yet.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-navy/5 text-xs uppercase text-brand-navy/60">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Wants to drive</th>
                <th className="px-4 py-3">CV</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy/10">
              {applications.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.full_name}</p>
                    <p className="text-xs text-brand-navy/50">ID: {a.id_number}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{a.email}</p>
                    <p className="text-xs text-brand-navy/50">{a.phone}</p>
                  </td>
                  <td className="px-4 py-3">{a.license_number}</td>
                  <td className="px-4 py-3">{a.preferred_category}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => downloadCv(a.id, a.cv_original_name)} className="text-accent hover:underline">
                      Download
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="space-x-2 px-4 py-3">
                    {a.status !== "approved" && (
                      <button onClick={() => setStatus(a.id, "approved")} className="text-accent hover:underline">Approve</button>
                    )}
                    {a.status !== "rejected" && (
                      <button onClick={() => setStatus(a.id, "rejected")} className="text-red-600 hover:underline">Reject</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-gutter text-xs text-brand-navy/50">
        Approving an application here doesn't automatically add them as a bookable chauffeur -
        add them to the Driver table (server/seed.py or a future /drivers admin form) once
        you've set their rate.
      </p>
    </div>
  );
}
