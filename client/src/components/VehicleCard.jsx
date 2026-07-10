import { useNavigate } from "react-router-dom";
import FeatureBadge from "./FeatureBadge";

// Reused on the Landing page, /vehicles browse grid, and the admin vehicles
// table. Keeping it as one component means a car listing looks IDENTICAL
// everywhere in the app - if you want to change how a car card looks,
// change it here and it updates everywhere.
export default function VehicleCard({ vehicle }) {
  const navigate = useNavigate();

  const fallbackImage =
    "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=600&q=60";

  return (
    <div
      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
      className="card group cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-brand-navy/5">
        <img
          src={vehicle.image_url || fallbackImage}
          alt={`${vehicle.make} ${vehicle.model}`}
          className="h-full w-full object-cover transition group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
      </div>

      <div className="space-y-2 p-gutter">
        <div className="flex items-start justify-between">
          <h3 className="font-display text-lg font-semibold">
            {vehicle.make} {vehicle.model}
          </h3>
          <span className="whitespace-nowrap font-semibold text-accent">
            KES {Number(vehicle.daily_rate).toLocaleString()}/day
          </span>
        </div>

        <p className="flex items-center gap-1 text-sm text-brand-navy/60">
          <span aria-hidden="true">📍</span> {vehicle.location}
        </p>

        {vehicle.features?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {vehicle.features.slice(0, 3).map((f) => (
              <FeatureBadge key={f.id ?? f.name} feature={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
