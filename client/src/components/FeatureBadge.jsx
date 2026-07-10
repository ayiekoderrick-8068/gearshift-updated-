import { FEATURE_ICON_MAP } from "../constants";

// Small pill shown inside VehicleCard and the vehicle detail page.
// `feature` is either a full feature object ({ name, icon }) or just a name
// string, depending on where it's called from - handle both.
export default function FeatureBadge({ feature }) {
  const name = typeof feature === "string" ? feature : feature.name;
  const icon = typeof feature === "string" ? null : FEATURE_ICON_MAP[feature.icon];

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-medium text-brand-navy/80">
      {icon && <span aria-hidden="true">{icon}</span>}
      {name}
    </span>
  );
}
