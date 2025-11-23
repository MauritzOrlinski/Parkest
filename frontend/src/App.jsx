import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MapPage from "./pages/MapPage.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // while we check localStorage token

  // On first load, try to restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    // Validate token + fetch current user
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // token invalid / expired
          localStorage.removeItem("authToken");
          setUser(null);
        } else {
          const userData = await res.json();
          setUser({
            ...userData,
            token,
          });
        }
      } catch (err) {
        console.error("Failed to restore user from token", err);
        localStorage.removeItem("authToken");
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  const handleLogin = (userData) => {
    // Persist token
    if (userData.token) {
      localStorage.setItem("authToken", userData.token);
    }
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  // While we’re checking the token, show a simple loading screen
  if (loadingUser) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Loading your session…</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Routes>
        {/* Landing page for visitors; logged-in users go straight to /map */}
        <Route
          path="/"
          element={
            user ? <Navigate to="/map" replace /> : <LandingPage />
          }
        />

        {/* Auth page: on success, goes to /map */}
        <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />

        {/* Main app page after login */}
        <Route
          path="/map"
          element={
            user ? (
              <MapPage user={user} onUserUpdate={setUser} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Profile page reachable from the map */}
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
