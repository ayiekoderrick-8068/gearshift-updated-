// Public route: /data-protection (deliberately NOT named/routed as
// "privacy-policy" - some ad/tracker blockers, including Brave Shields'
// default filter lists, block any request whose URL contains that phrase,
// which in Vite's dev server (where each component is its own file
// request) took down the ENTIRE app, not just this page, because App.jsx
// imports every page unconditionally at the top of the file. See the
// React.lazy + Suspense change in App.jsx for the other half of this fix -
// now a single blocked/broken page can only break itself, not the whole site.
export default function DataProtection() {
  return (
    <div className="section-wrap max-w-3xl py-section">
      <h1 className="mb-gutter text-4xl">Privacy Policy</h1>
      <div className="space-y-gutter text-sm text-brand-navy/70">
        <p>Last updated: July 2026</p>
        <p>
          We collect the information you provide when creating an account (email, license number)
          and information generated while using the platform (bookings, listings, reviews). This
          data is used solely to operate GearShift - matching renters with owners, processing
          bookings, and maintaining trust and safety on the platform.
        </p>
        <p>
          Passwords are never stored in plain text - they're hashed before saving. We do not sell
          your personal information to third parties. You can request an export or deletion of
          your account data at any time by contacting support.
        </p>
        <p>
          &copy; 2026 GearShift. All rights reserved.
        </p>
      </div>
    </div>
  );
}
