import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import VehicleCard from "../components/VehicleCard";
import LoadingSpinner from "../components/LoadingSpinner";
import HeroCarousel from "../components/HeroCarousel";

const STEPS = [
  { title: "Search", body: "Browse verified vehicles by city, category and price." },
  { title: "Book", body: "Pick your dates, see the total upfront, and request to book." },
  { title: "Drive", body: "Get confirmed by the owner and pick up your car." },
];

export default function Landing() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/vehicles")
      .then((res) => setVehicles(res.data.slice(0, 6)))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero - rotating background carousel of premium vehicles, with the
          headline/CTA content passed in as children so it overlays on top. */}
      <HeroCarousel>
        {/* text-white is required here, not just inherited - the global
            base style in index.css (`h1 { @apply text-brand-navy }`) sets a
            dark colour directly on every <h1>, which otherwise wins over
            the white text color on this section's wrapper div and made the
            headline nearly unreadable against the hero photos. */}
        <h1 className="max-w-2xl text-4xl text-white sm:text-5xl">
          Rent the right car, from people near you.
        </h1>
        <p className="max-w-xl text-white/80">
          GearShift connects verified car owners with renters across Kenya - browse a fleet of
          50+ vehicles, book in minutes, and drive.
        </p>
        <div className="flex gap-gutter">
          <Link to="/vehicles" className="btn-primary">Browse cars</Link>
          <Link to="/vehicles/new" className="btn-secondary bg-transparent text-white hover:bg-white/10">
            List your car
          </Link>
        </div>
      </HeroCarousel>

      {/* How it works */}
      <section className="section-wrap py-section">
        <h2 className="mb-gutter-lg text-center text-3xl">How it works</h2>
        <div className="grid gap-gutter sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="card p-gutter text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-brand-navy/60">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Event/convoy CTA - weddings, funerals, safaris, and group
          transportation all book several vehicles at once. Shown to
          everyone (guests get sent to /login first via ProtectedRoute if
          they click through, same as any other protected link). */}
      <section className="bg-brand-navy-light">
        <div className="section-wrap flex flex-col items-center justify-between gap-gutter py-section-lg text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-2xl text-white sm:text-3xl">Planning something bigger than one car?</h2>
            <p className="mt-2 max-w-xl text-white/70">
              Weddings, funerals, safaris, or group transportation - book a full convoy in one
              go, with a self-drive or chauffeur option for every vehicle, and an automatic
              discount the more cars you book together.
            </p>
          </div>
          <Link to="/events/new" className="btn-primary whitespace-nowrap">Book a convoy</Link>
        </div>
      </section>

      {/* Featured vehicles */}
      <section className="section-wrap pb-section">
        <div className="mb-gutter-lg flex items-center justify-between">
          <h2 className="text-3xl">Featured vehicles</h2>
          <Link to="/vehicles" className="text-sm font-medium text-accent hover:underline">
            See all &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading featured cars..." />
        ) : vehicles.length === 0 ? (
          <p className="text-brand-navy/60">No cars available yet - check back soon.</p>
        ) : (
          <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
