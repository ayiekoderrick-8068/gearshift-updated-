import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import FeatureBadge from "../components/FeatureBadge";
import RatingStars from "../components/RatingStars";
import LoadingSpinner from "../components/LoadingSpinner";

// Public route: /vehicles/:id
export default function VehicleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/vehicles/${id}`)
      .then((res) => setVehicle(res.data))
      .catch(() => setVehicle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading vehicle..." />;
  if (!vehicle) {
    return (
      <div className="section-wrap py-section text-center text-brand-navy/60">
        Vehicle not found. <Link to="/vehicles" className="text-accent hover:underline">Back to browse</Link>
      </div>
    );
  }

  const fallbackImage =
    "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=60";
  const isOwner = user?.id === vehicle.owner_id;

  return (
    <div className="section-wrap py-section">
      <div className="grid gap-gutter-lg lg:grid-cols-2">
        <img
          src={vehicle.image_url || fallbackImage}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="aspect-[4/3] w-full rounded-card object-cover"
          onError={(e) => { e.currentTarget.src = fallbackImage; }}
        />

        <div className="space-y-gutter">
          <div>
            <h1 className="text-3xl">{vehicle.make} {vehicle.model} <span className="text-brand-navy/40">({vehicle.year})</span></h1>
            <p className="mt-1 flex items-center gap-1 text-brand-navy/60">
              <span aria-hidden="true">📍</span> {vehicle.location} &middot; {vehicle.category}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <RatingStars rating={vehicle.owner_rating || 0} />
            <span className="text-sm text-brand-navy/60">Listed by {vehicle.owner_name}</span>
          </div>

          <p className="text-2xl font-semibold text-accent">
            KES {Number(vehicle.daily_rate).toLocaleString()}<span className="text-base text-brand-navy/60">/day</span>
          </p>

          <p className="text-brand-navy/80">{vehicle.description}</p>

          {vehicle.features?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((f) => <FeatureBadge key={f.id} feature={f} />)}
            </div>
          )}

          <div className="flex gap-gutter pt-2">
            {isOwner ? (
              <Link to={`/vehicles/${vehicle.id}/edit`} className="btn-secondary">Edit listing</Link>
            ) : user ? (
              <button onClick={() => navigate(`/book/${vehicle.id}`, { state: { vehicle } })} className="btn-primary">
                Book this car
              </button>
            ) : (
              <Link to="/login" className="btn-primary">Log in to book</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
