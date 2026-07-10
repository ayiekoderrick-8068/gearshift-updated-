import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api";

// Auth persists the JWT (and a cached copy of the user) in localStorage, so
// refreshing the page - or closing and reopening the tab - keeps you logged
// in instead of bouncing back to /login. An earlier version of this file
// kept auth in React state only; that meant every page refresh lost the
// session, which is confusing for anyone actually using the app day to day.
//
// The one wrinkle: api.js runs outside of React (it's a plain Axios
// instance) so it can't call useContext(). We mirror the token onto
// `window.__gearshift_token` whenever it changes so the request interceptor
// in api.js can read it. That mirror is an implementation detail - every
// component should still go through useAuth(), never touch window directly.
const AuthContext = createContext(null);

const TOKEN_KEY = "gearshift_token";
const USER_KEY = "gearshift_user";
// Which localStorage key holds the driver's session when logged in via
// /driver-login instead of the regular client/admin /login - kept separate
// so a browser can't confuse "logged in as a driver" with "logged in as a
// client", since drivers see a completely different portal (see
// pages/DriverPortal.jsx and pages/DriverLogin.jsx).
const DRIVER_TOKEN_KEY = "gearshift_driver_token";
const DRIVER_KEY = "gearshift_driver";

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(USER_KEY));
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [driver, setDriver] = useState(() => readJSON(DRIVER_KEY));
  const [driverToken, setDriverToken] = useState(() => localStorage.getItem(DRIVER_TOKEN_KEY) || null);
  const [ready, setReady] = useState(false);

  // Mirror onto window immediately (before the effect below) so api.js has
  // the token available for the very first request, even one fired during
  // the initial render.
  window.__gearshift_token = token;
  window.__gearshift_driver_token = driverToken;

  // On first load, if we have a token from a previous session, re-fetch
  // /me to make sure it hasn't expired or been revoked (banned account,
  // etc.) and to refresh the cached user data. If that request fails, the
  // token is bad - clear everything and fall back to logged-out.
  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get("/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setReady(true));
    // Only run once on mount - deliberately not re-running when `token`
    // changes later (login()/logout() below already keep state in sync).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    window.__gearshift_token = jwtToken;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.__gearshift_token = null;
  }, []);

  // updateUser is used by /profile after a successful PUT /me so the navbar
  // and other components re-render with the fresh data immediately.
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...partial } : prev;
      if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Separate login/logout for the driver portal (see pages/DriverLogin.jsx,
  // pages/DriverPortal.jsx). Kept distinct from the client/admin session
  // above so a person can't accidentally end up "logged in as both" in a
  // way that confuses which navbar/routes should show.
  const driverLogin = useCallback((driverData, jwtToken) => {
    setDriver(driverData);
    setDriverToken(jwtToken);
    localStorage.setItem(DRIVER_TOKEN_KEY, jwtToken);
    localStorage.setItem(DRIVER_KEY, JSON.stringify(driverData));
    window.__gearshift_driver_token = jwtToken;
  }, []);

  const driverLogout = useCallback(() => {
    setDriver(null);
    setDriverToken(null);
    localStorage.removeItem(DRIVER_TOKEN_KEY);
    localStorage.removeItem(DRIVER_KEY);
    window.__gearshift_driver_token = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, ready, login, logout, updateUser, driver, driverToken, driverLogin, driverLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components do `const { user } = useAuth()` instead of
// importing useContext + AuthContext everywhere.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
