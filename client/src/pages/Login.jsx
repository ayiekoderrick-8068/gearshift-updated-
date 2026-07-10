import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { AUTH_BG_IMAGES } from "../constants";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });
      login(res.data.user, res.data.token);
      // If ProtectedRoute redirected the user here, send them back to
      // wherever they originally tried to go. Otherwise pick a sensible
      // default landing page by role - an admin logging in has no use for
      // /dashboard (that's the owner's booking-request inbox, and admins
      // don't own vehicles), they want /admin where bookings, users and
      // listings are all one click away instead of buried behind "Admin"
      // in the navbar.
      const fallback = res.data.user.role === "admin" ? "/admin" : "/dashboard";
      const redirectTo = location.state?.from?.pathname || fallback;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      {/* Background collage - one real photo per occasion GearShift
          serves (wedding/safari/funeral/group transport), so the sign-in
          page isn't just plain white. See AUTH_BG_IMAGES in constants.js. */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {AUTH_BG_IMAGES.map((url) => (
          <div key={url} className="bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
        ))}
      </div>
      <div className="absolute inset-0 bg-brand-navy-dark/85" />

      <div className="section-wrap relative flex min-h-[80vh] items-center justify-center py-section">
        <div className="card w-full max-w-md space-y-gutter p-gutter-lg">
          <h1 className="text-2xl">Log in</h1>

        {error && (
          <p className="rounded-card bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-gutter">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

          <div className="flex justify-between text-sm text-brand-navy/60">
            <Link to="/reset-password" className="hover:text-accent">Forgot password?</Link>
            <Link to="/signup" className="hover:text-accent">Sign up</Link>
          </div>

          <div className="border-t border-brand-navy/10 pt-gutter text-center text-sm text-brand-navy/60">
            <p>
              Already a GearShift driver? <Link to="/driver-login" className="text-accent hover:underline">Log in here</Link>
            </p>
            <p className="mt-1">
              Chauffeur for hire? <Link to="/become-a-driver" className="text-accent hover:underline">Apply to drive with us</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
