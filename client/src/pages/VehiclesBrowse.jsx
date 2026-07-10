import { useEffect, useState } from "react";
import api from "../api";
import VehicleCard from "../components/VehicleCard";
import SearchFilter from "../components/SearchFilter";
import LoadingSpinner from "../components/LoadingSpinner";

// Public route: /vehicles
export default function VehiclesBrowse() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchVehicles(params = {}) {
    setLoading(true);
    api
      .get("/vehicles", { params })
      .then((res) => setVehicles(res.data))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <div className="section-wrap py-section">
      <h1 className="mb-gutter-lg text-3xl">Browse cars</h1>

      <div className="grid gap-gutter lg:grid-cols-[280px_1fr]">
        <aside>
          <SearchFilter onFilter={fetchVehicles} />
        </aside>

        <div>
          {loading ? (
            <LoadingSpinner label="Loading cars..." />
          ) : vehicles.length === 0 ? (
            <div className="card p-section text-center text-brand-navy/60">No cars found.</div>
          ) : (
            <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
