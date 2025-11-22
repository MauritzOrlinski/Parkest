import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function MapPage({ user }) {
  useEffect(() => {
    // If Google Maps is already there, just re-init
    if (window.google && window.google.maps && typeof window.initMap === "function") {
      window.initMap();
      return;
    }

    const parkingScript = document.createElement("script");
    parkingScript.src = "/parking-lines.js"; // from public/
    parkingScript.async = true;

    parkingScript.onload = () => {
      const googleScript = document.createElement("script");
      googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
      googleScript.async = true;
      googleScript.defer = true;
      document.body.appendChild(googleScript);
    };

    parkingScript.onerror = () => {
      console.error("Failed to load parking-lines.js");
    };

    document.body.appendChild(parkingScript);
  }, []);

  return (
    <div className="screen map-screen">
      <header className="header header--map">
        <div className="header-left">
          <h1 className="logo">Parking Buddy</h1>
        </div>
        <div className="header-right">
          <span className="header-username">
            {user?.name ? `Hi, ${user.name.split(" ")[0]}` : ""}
          </span>
          <Link to="/profile" className="btn-secondary header-profile-btn">
            Profile
          </Link>
        </div>
      </header>

      <main className="screen-main map-screen-main">
        <div id="map" className="map-container" />
      </main>
    </div>
  );
}

export default MapPage;
