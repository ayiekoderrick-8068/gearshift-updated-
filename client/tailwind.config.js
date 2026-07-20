/**
 * Tailwind config for GearShift.
 *
 * Custom theme values live here instead of relying on Tailwind's defaults so
 * the whole app shares one palette / font pairing / spacing rhythm.
 * If you want to tweak the brand colours or spacing later, this is the ONLY
 * file you need to touch - every component just references these tokens
 * (e.g. bg-brand-navy, gap-gutter) instead of hardcoding hex codes.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colour - dark charcoal/navy, used for navbar, footer,
        // headings and primary buttons.
        brand: {
          navy: "#101826",
          "navy-light": "#1c2942",
          "navy-dark": "#0a0f18",
        },
        // Accent colour - warm burnt orange, used for CTAs, active states,
        // links and highlight badges.
        accent: {
          DEFAULT: "#f4793a",
          dark: "#d85f22",
          light: "#ffb385",
        },
        // Warm off-white instead of pure #fff - reads less "default template".
        surface: {
          DEFAULT: "#f7f5f2",
          card: "#ffffff",
        },
      },
      fontFamily: {
        // Headline font - distinct geometric look for h1/h2/h3 and the logo.
        display: ["\"Space Grotesk\"", "sans-serif"],
        // Body font - used for paragraphs, labels, inputs.
        sans: ["Inter", "sans-serif"],
        // Elegant italic serif reserved for the /services hero headline -
        // see pages/Services.jsx. Not used elsewhere in the app.
        serif: ["\"Playfair Display\"", "serif"],
      },
      // Custom spacing scale on top of Tailwind's defaults. Section paddings
      // and card gaps use these named tokens (gutter / section) rather than
      // the plain numeric scale, so the layout rhythm is our own rather than
      // the default 4px grid everyone reaches for.
      spacing: {
        gutter: "1.85rem",
        "gutter-lg": "2.65rem",
        section: "5.5rem",
        "section-lg": "7.25rem",
      },
      borderRadius: {
        card: "0.85rem",
      },
      boxShadow: {
        card: "0 4px 24px -6px rgba(16, 24, 38, 0.12)",
      },
    },
  },
  plugins: [],
}
