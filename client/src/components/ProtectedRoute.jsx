import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

// Wraps any route that requires login. Usage in App.jsx:
//   <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
// For admin-only routes, add requiredRole="admin":
//   <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
export default function ProtectedRoute({ children, requiredRole }) {
  const { token, user, ready } = useAuth();
  const location = useLocation();

  // On the very first render after a page refresh, AuthContext is still
  // re-validating a persisted token against GET /me (see AuthContext.jsx).
  // Without this check, a logged-in user hitting refresh on a protected
  // page would flash-redirect to /login for a split second before the
  // token finished being restored. Waiting for `ready` avoids that.
  if (!ready) {
    return <LoadingSpinner label="Loading..." />;
  }

  // Not logged in at all -> bounce to /login, remember where they were
  // headed so we could redirect back after login if we wanted to.
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role (e.g. a client trying to hit /admin) -> send
  // them home instead of showing a broken/empty admin page.
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
