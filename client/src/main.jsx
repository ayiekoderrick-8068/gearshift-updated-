import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CompareProvider } from "./context/CompareContext.jsx";
import "./index.css";

// Entry point. AuthProvider wraps everything so any component in the tree
// can read the logged-in user via useAuth() - see context/AuthContext.jsx.
// CompareProvider does the same for the vehicle comparison list (see
// context/CompareContext.jsx) - nested inside AuthProvider since it's
// independent of login state (comparison works for guests too).
// BrowserRouter lives here (not in App.jsx) so App.jsx only has to worry
// about defining routes, not the router setup itself.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompareProvider>
          <App />
        </CompareProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
