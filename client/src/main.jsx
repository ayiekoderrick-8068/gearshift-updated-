import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

// Entry point. AuthProvider wraps everything so any component in the tree
// can read the logged-in user via useAuth() - see context/AuthContext.jsx.
// BrowserRouter lives here (not in App.jsx) so App.jsx only has to worry
// about defining routes, not the router setup itself.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
