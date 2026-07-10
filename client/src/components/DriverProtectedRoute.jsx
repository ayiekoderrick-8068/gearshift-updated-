import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps /driver-portal. Separate from <ProtectedRoute> on purpose - a
// Driver isn't a User (see models/driver.py), it has its own token/session
// (driverToken/driver, not token/user) mirrored onto
// window.__gearshift_driver_token by AuthContext, so this checks that
// instead of the client/admin token.
export default function DriverProtectedRoute({ children }) {
  const { driverToken } = useAuth();

  if (!driverToken) {
    return <Navigate to="/driver-login" replace />;
  }

  return children;
}
