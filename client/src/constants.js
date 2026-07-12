// Shared dropdown data used across VehicleForm, SearchFilter, seed data, etc.
// Kept in one place so nobody hardcodes their own copy of "the list of
// cities" in three different files (DRY).

export const KENYAN_CITIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
];

export const VEHICLE_CATEGORIES = [
  "SUV",
  "Sedan",
  "Truck",
  "Convertible",
  "Van",
  "Limousine",
  "Hearse",
  "Safari",
  "Bus",
];

export const VEHICLE_YEARS = Array.from({ length: 2025 - 2010 + 1 }, (_, i) => 2010 + i).reverse();

// Search Options filter panel (SearchFilter.jsx) - values mirror the
// columns added to the Vehicle model / server/seed.py so every option here
// actually matches data in the database.
export const VEHICLE_CONDITIONS = ["New", "Used"];

export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric"];

export const TRANSMISSIONS = ["Automatic", "Manual"];

export const DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD"];

export const EXTERIOR_COLORS = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Beige"];

export const MAX_MILEAGE_OPTIONS = [
  { label: "Under 20,000 km", value: 20000 },
  { label: "Under 50,000 km", value: 50000 },
  { label: "Under 100,000 km", value: 100000 },
  { label: "Under 150,000 km", value: 150000 },
];

// Make -> Model options for the Search Options panel's cascading dropdowns.
// Mirrors the make/model pairs in server/seed.py's MODEL_CATALOG so every
// combination shown here actually exists in the seeded fleet.
export const VEHICLE_MAKE_MODELS = [
  { make: "Lincoln", model: "Town Car Limousine" },
  { make: "Rolls-Royce", model: "Funeral Hearse" },
  { make: "Toyota", model: "RAV4" },
  { make: "Nissan", model: "X-Trail" },
  { make: "Subaru", model: "Forester" },
  { make: "Honda", model: "CR-V" },
  { make: "Land Rover", model: "Range Rover" },
  { make: "Mercedes-Benz", model: "C-Class" },
  { make: "Volkswagen", model: "Golf" },
  { make: "Toyota", model: "Corolla" },
  { make: "Mazda", model: "Demio" },
  { make: "Toyota", model: "Hilux" },
  { make: "Ford", model: "Ranger" },
  { make: "Isuzu", model: "D-Max" },
  { make: "Toyota", model: "Hiace" },
  { make: "Nissan", model: "Urvan" },
  { make: "BMW", model: "4 Series" },
  { make: "Porsche", model: "911" },
  { make: "Bentley", model: "Continental GT" },
  { make: "Toyota", model: "Land Cruiser 70" },
  { make: "Toyota", model: "Land Cruiser Prado" },
  { make: "Toyota", model: "Land Cruiser 200" },
  { make: "Toyota", model: "Coaster Shuttle" },
  { make: "Toyota", model: "Coaster" },
  { make: "Scania", model: "Touring Coach" },
];

export const VEHICLE_MAKES = [...new Set(VEHICLE_MAKE_MODELS.map((m) => m.make))].sort();

// Event types for the convoy/event booking flow - weddings, funerals,
// safaris, and group transportation all book several vehicles at once (see
// pages/EventBooking.jsx and POST /bookings/convoy on the backend).
export const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "funeral", label: "Funeral" },
  { value: "safari", label: "Safari" },
  { value: "group_transportation", label: "Group transportation" },
  { value: "other", label: "Other" },
];

// Which vehicle categories to show for each event type, IN PRIORITY ORDER -
// the first category in each list is what a renter picking that event
// actually came here for (Limousine for a wedding, Hearse for a funeral,
// Safari for a safari, Bus for group transport), so EventBooking.jsx sorts
// the vehicle grid to match this order rather than showing everything
// suggested in a random/database order. This list is also the STRICT
// filter for the default view - "Browse all categories" is the escape
// hatch if someone wants something outside these.
export const EVENT_SUGGESTED_CATEGORIES = {
  wedding: ["Limousine", "Convertible", "SUV", "Sedan"],
  funeral: ["Hearse", "SUV", "Sedan", "Van"],
  safari: ["Safari", "SUV"],
  group_transportation: ["Bus", "Van"],
  other: ["SUV", "Sedan", "Van", "Limousine", "Convertible", "Safari", "Bus", "Hearse", "Truck"],
};

// Purely visual theming for the EventBooking page banner - a different
// background PHOTO + colour overlay per event type so the page actually
// looks different for a wedding vs a funeral vs a safari vs group
// transport at a glance, without the visitor having to read anything.
// bgImage is a real photo via Wikimedia Commons' Special:FilePath redirect
// (same stable hotlinking mechanism used for the vehicle fleet in seed.py) -
// reusing the exact same hearse/safari/bus photos already proven to load
// correctly elsewhere in the app, so only the wedding photo is new.
function commonsUrl(filename, width = 1600) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=${width}`;
}

export const EVENT_THEMES = {
  wedding: {
    bgImage: commonsUrl("Turkmen_Decorated_wedding_car.jpg"),
    gradient: "bg-gradient-to-r from-rose-950/90 via-rose-900/60 to-transparent",
    textClass: "text-white",
    emoji: "💍",
    heading: "Plan your wedding convoy",
    body: "Limousines and premium cars for the bridal party, with a discount the more you book together.",
  },
  funeral: {
    bgImage: commonsUrl("Rolls_Royce_Funeral_Hearse_(1).jpg"),
    gradient: "bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-transparent",
    textClass: "text-white",
    emoji: "🕊️",
    heading: "Arrange a funeral convoy",
    body: "A dignified hearse and accompanying vehicles, with experienced chauffeurs available.",
  },
  safari: {
    bgImage: commonsUrl("Toyota_Land_Cruiser_200_002.JPG"),
    gradient: "bg-gradient-to-r from-emerald-950/90 via-emerald-900/55 to-transparent",
    textClass: "text-white",
    emoji: "🦁",
    heading: "Book your safari fleet",
    body: "Land Cruisers built for game parks and reserves, in a range of trims and prices.",
  },
  group_transportation: {
    bgImage: commonsUrl("Toyota_Coaster_Mini_Bus_2015.jpg"),
    gradient: "bg-gradient-to-r from-sky-950/90 via-sky-900/55 to-transparent",
    textClass: "text-white",
    emoji: "🚌",
    heading: "Move your group together",
    body: "Buses and vans for school trips, staff transport, or large tour groups.",
  },
  other: {
    bgImage: commonsUrl("Land_Rover_Range_Rover_P525_Autobiography_L405_black_(4).jpg"),
    gradient: "bg-gradient-to-r from-brand-navy-dark/90 via-brand-navy/60 to-transparent",
    textClass: "text-white",
    emoji: "🚗",
    heading: "Book vehicles for your event",
    body: "Pick whatever mix of vehicles your event needs.",
  },
};

// Convoy discount tiers, mirrored from server/routes/bookings.py's
// CONVOY_DISCOUNT_TIERS purely so the frontend can preview the discount
// before submitting - the backend always recalculates and is the source
// of truth, this is just so the price preview isn't blank while typing.
export const CONVOY_DISCOUNT_TIERS = [
  { minVehicles: 6, discount: 0.15 },
  { minVehicles: 4, discount: 0.10 },
  { minVehicles: 2, discount: 0.05 },
];

export function previewConvoyDiscount(vehicleCount) {
  for (const tier of CONVOY_DISCOUNT_TIERS) {
    if (vehicleCount >= tier.minVehicles) return tier.discount;
  }
  return 0;
}

// Background collage for the Login/Signup pages - one photo per major
// occasion GearShift serves (wedding, safari, funeral, group transport),
// reusing the exact same Wikimedia Commons photos as EVENT_THEMES above so
// there's no new/unverified image URL introduced just for this. Rendered
// as a 2x2 grid behind a dark overlay wash - see pages/Login.jsx.
//
// Top-left slot is a Mercedes-Benz E-Class 2020 (W213 facelift) rather than
// the wedding car - swapped on request. Sourced from Wikimedia Commons
// (same stable Special:FilePath hotlinking as every other photo here)
// instead of the originally-requested mad4wheels.com link, which only
// exposes a 420x280 thumbnail as a direct URL (its full-res photos require
// a manual download click, no stable hotlink) and are licensed personal-use
// only.
export const AUTH_BG_IMAGES = [
  commonsUrl("Mercedes-Benz_W213_Facelift_IMG_3726.jpg"),
  commonsUrl("Toyota_Land_Cruiser_200_002.JPG"),
  commonsUrl("Rolls_Royce_Funeral_Hearse_(1).jpg"),
  commonsUrl("Toyota_Coaster_Mini_Bus_2015.jpg"),
];

// Kenyan phone format shared by every booking form: +254 followed by
// exactly 9 digits (e.g. +254795038762). Mirrors PHONE_PATTERN in
// server/routes/bookings.py - the backend re-validates this regardless,
// this is just so the user gets instant feedback instead of a round trip.
export const PHONE_REGEX = /^\+254\d{9}$/;

export function isValidKenyanPhone(value) {
  return PHONE_REGEX.test(value || "");
}

// Maps a feature's `icon` string (stored in the DB, e.g. "gps") to an emoji
// so we don't need an icon library just for this. Swap these for a proper
// icon set later if you want.
export const FEATURE_ICON_MAP = {
  gps: "\u{1F4CD}",
  bluetooth: "\u{1F4F6}",
  awd: "\u{1F698}",
  heated_seats: "\u{1F525}",
  backup_camera: "\u{1F4F7}",
  apple_carplay: "\u{1F4F1}",
  sunroof: "☀️",
  "4wd": "⛰️",
  usb_charging: "\u{1F50C}",
  leather_seats: "\u{1FA91}",
};

// Colour-coded booking status pills. Used by StatusBadge.jsx and reused by
// MyBookings, OwnerDashboard and the admin booking table so every badge
// looks identical everywhere.
export const BOOKING_STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-gray-200 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  // Reused by StatusBadge for a booking's driver_status too (see
  // pages/DriverPortal.jsx, pages/MyBookings.jsx) - "pending" is shared
  // with the booking status styles above on purpose (same amber meaning
  // "awaiting a decision" either way).
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};
