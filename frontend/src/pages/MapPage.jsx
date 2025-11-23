import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import MapComponent from "../components/maps";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const FALLBACK_CENTER = { lat: 48.13513, lng: 11.58198 }; // Munich
const libraries = ["places"];

function MapPage({ user }) {
  const [center, setCenter] = useState(FALLBACK_CENTER);
  const [zoom, setZoom] = useState(15);
  const [locations, setLocations] = useState([]);
  const [status, setStatus] = useState("Getting your location…");
  const [error, setError] = useState(null);
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Center map on user location at the beginning (NO parking calls yet)
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus(
        "Geolocation not supported. Using default location. Enter a destination to search for parking."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = { lat: latitude, lng: longitude };
        setUserLocation(loc);
        setCenter(loc);
        setZoom(15);
        setStatus("Enter a destination address to search for parking near it.");
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setCenter(FALLBACK_CENTER);
        setZoom(12);
        setError("Could not get your location. Using default location.");
        setStatus("Enter a destination address to search for parking near it.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  // Get nearest parking spots + search time, around DESTINATION
  const fetchNearestParkingWithEstimates = async (latitude, longitude) => {
    try {
      setStatus("Searching for nearby parking at your destination…");

      const nearestRes = await fetch(
        `${API_BASE_URL}/nearest?latitude=${encodeURIComponent(
          latitude
        )}&longitude=${encodeURIComponent(longitude)}&radius_m=500`
      );

      if (!nearestRes.ok) {
        throw new Error("Failed to fetch nearest parking spots");
      }

      const spots = await nearestRes.json();

      if (!spots || spots.length === 0) {
        setLocations([]);
        setStatus("No parking spots found near this destination.");
        return;
      }

      setStatus(`Found ${spots.length} parking spots. Estimating search times…`);

      const estimates = await Promise.all(
        spots.map(async (spot) => {
          try {
            const estRes = await fetch(`${API_BASE_URL}/estimate_search_time`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                total_capacity: spot.capacity,
                latitude: spot.latitude,
                longitude: spot.longitude,
              }),
            });

            if (!estRes.ok) {
              throw new Error("Failed to estimate search time");
            }

            const data = await estRes.json();
            return data.estimated_search_time_minutes;
          } catch (e) {
            console.error("Estimate error for spot", spot.id, e);
            return null;
          }
        })
      );

      const mappedLocations = spots.map((spot, idx) => {
        const est = estimates[idx];
        const roundedMinutes =
          est != null && Number.isFinite(est) ? Math.round(est) : null;

        return {
          id: spot.id,
          lat: spot.latitude,
          lng: spot.longitude,
          waitingTime: roundedMinutes != null ? `${roundedMinutes} minutes` : "N/A",
          label: spot.address || `Parking ${spot.id}`,
          distance_m: spot.distance_m,
          parkingType: spot.parking_type,
          capacity: spot.capacity,
        };
      });

      setLocations(mappedLocations);
      setStatus(
        `Showing ${mappedLocations.length} parking spots near your destination.`
      );
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong while loading parking data.");
      setStatus("Could not load parking spots for this destination.");
      setLocations([]);
    }
  };

  const onAutocompleteLoad = (autocompleteInstance) => {
    autocompleteRef.current = autocompleteInstance;
  };

  // Called when user submits the form
  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError(null);
    setStatus("Looking up the address…");

    try {
      if (!autocompleteRef.current) {
        throw new Error("Autocomplete is not ready yet. Try again in a second.");
      }

      const place = autocompleteRef.current.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        throw new Error("Please select an address from the suggestions.");
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      const dest = { lat, lng };
      setDestination(dest);

      // Center & zoom on destination
      setCenter(dest);
      setZoom(17);

      // Now fetch parking around the DESTINATION
      await fetchNearestParkingWithEstimates(lat, lng);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to search for this address.");
      setStatus("Could not find parking for this destination.");
    } finally {
      setIsSearching(false);
    }
  };

  if (loadError) {
    return <div>Map Load Error: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading map…</div>;
  }

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
        {/* Status / error pill */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            padding: "6px 12px",
            borderRadius: "999px",
            background: "rgba(15,23,42,0.9)",
            color: "white",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "90%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span>{status}</span>
          {error && (
            <span style={{ color: "#f97373", fontWeight: 500 }}>
              • {error}
            </span>
          )}
        </div>

        {/* Destination search with Google Places Autocomplete */}
        <form
          onSubmit={handleSearch}
          style={{
            position: "absolute",
            top: "120px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            display: "flex",
            gap: "8px",
            padding: "4px 8px",
            background: "rgba(15,23,42,0.9)",
            borderRadius: "999px",
            alignItems: "center",
            maxWidth: "90%",
          }}
        >
          <Autocomplete onLoad={onAutocompleteLoad}>
            <input
              type="text"
              placeholder="Enter destination address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "8px 10px",
                borderRadius: "999px",
                fontSize: "14px",
              }}
            />
          </Autocomplete>
          <button
            type="submit"
            disabled={isSearching}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "8px 14px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isSearching ? "default" : "pointer",
              opacity: isSearching ? 0.7 : 1,
              background:
                "linear-gradient(135deg, rgba(59,130,246,1), rgba(129,140,248,1))",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            {isSearching ? "Searching…" : "Search parking"}
          </button>
        </form>

        <MapComponent
          apiKey={GOOGLE_MAPS_API_KEY}
          center={center}
          zoom={zoom}
          locations={locations}
          userLocation={userLocation}
          destination={destination}
        />
      </main>
    </div>
  );
}

export default MapPage;
