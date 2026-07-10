import axios from "axios";

// Single Axios instance for the whole app. Everyone imports THIS - nobody
// should create `axios.create()` again in a page/component, otherwise the
// auth header logic below would have to be duplicated everywhere (breaks DRY
// and means someone could easily forget to attach the token).
//
// Base URL comes from the Vite env var so it can point at localhost while
// developing and at the deployed Render URL in production, without touching
// code. Set VITE_API_URL in client/.env (see .env.example).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: read the JWT that AuthContext mirrors onto
// `window.__gearshift_token` at login time (and persists to localStorage,
// so it survives a page refresh) and attach it to every outgoing request.
// Routes that don't need auth just ignore the header, so it's safe to
// always attach it.
api.interceptors.request.use((config) => {
  const token = window.__gearshift_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Separate instance for the driver portal (see pages/DriverLogin.jsx,
// pages/DriverPortal.jsx). Drivers authenticate with their own JWT (issued
// by POST /driver-login, not /login), so this instance attaches
// `window.__gearshift_driver_token` instead of the client/admin token -
// otherwise a driver logged in on one tab and a client logged in on
// another would clobber each other's Authorization header.
export const driverApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

driverApi.interceptors.request.use((config) => {
  const token = window.__gearshift_driver_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
