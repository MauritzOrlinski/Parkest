import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MapPage from "./pages/MapPage.jsx";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="app-root">
      <Routes>
        {/* Landing page for visitors; logged-in users jump directly to /map */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/map" replace />
            ) : (
              <LandingPage isLoggedIn={false} />
            )
          }
        />

        {/* Auth page: on success, goes to /map */}
        <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />

        {/* Main app page after login */}
        <Route
          path="/map"
          element={
            user ? (
              <MapPage user={user} />
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
