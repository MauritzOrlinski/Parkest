import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const initialZoom = 12;

const hiddenMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// ----- MARKER ICONS -----
const getMarkerIcon = (waitingTime) => {
  let minutes = parseInt(waitingTime, 10);
  if (Number.isNaN(minutes)) minutes = null;

  let fill = "#22c55e"; // green default
  if (minutes == null) {
    fill = "#9ca3af"; // gray for N/A
  } else if (minutes >= 15 && minutes < 30) {
    fill = "#f97316"; // orange
  } else if (minutes >= 30) {
    fill = "#ef4444"; // red
  }

  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: "#0f172a",
    strokeWeight: 1.5,
    scale: 1.4,
  };
};

// ----- DESKTOP INFO WINDOW CONTENT -----
const MarkerInfoContent = ({ location }) => (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
      maxWidth: "260px",
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        marginBottom: "4px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "14px",
          fontWeight: 600,
          color: "#0f172a",
        }}
      >
        {location.label || "Parking spot"}
      </h3>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 600,
          backgroundColor: "#e5f0ff",
          color: "#1d4ed8",
          whiteSpace: "nowrap",
        }}
      >
        {location.waitingTime || "N/A"}
      </span>
    </div>

    <p
      style={{
        margin: "4px 0 0",
        fontSize: "12px",
        color: "#6b7280",
      }}
    >
      <span style={{ fontWeight: 500 }}>Coordinates:</span>{" "}
      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
    </p>
  </div>
);

// ----- MAIN MAP COMPONENT -----
function MapComponent({
  apiKey,
  locations = [],
  center: propCenter,
  zoom: propZoom,
  userLocation,
  destination,
  onStartTrip,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [activeMarker, setActiveMarker] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedParking, setSelectedParking] = useState(null);
  const [directionsCar, setDirectionsCar] = useState(null);
  const [directionsWalk, setDirectionsWalk] = useState(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkSize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleMarkerClick = useCallback((location) => {
    setActiveMarker(location);
    setSelectedParking(location);
    setDirectionsCar(null);
    setDirectionsWalk(null);
  }, []);

  const handleCloseClick = useCallback(() => {
    setActiveMarker(null);
    setSelectedParking(null);
    setDirectionsCar(null);
    setDirectionsWalk(null);
  }, []);

  const center = useMemo(() => {
    if (
      propCenter &&
      typeof propCenter.lat === "number" &&
      typeof propCenter.lng === "number"
    ) {
      return { lat: propCenter.lat, lng: propCenter.lng };
    }
    if (locations.length > 0) {
      return { lat: locations[0].lat, lng: locations[0].lng };
    }
    return { lat: 48.13513, lng: 11.58198 }; // Munich fallback
  }, [propCenter, locations]);

  const effectiveZoom =
    typeof propZoom === "number" && !Number.isNaN(propZoom)
      ? propZoom
      : initialZoom;

  // Average estimated search time (minutes) over all numeric spots
  const averageSearchTimeMinutes = useMemo(() => {
    const times = locations
      .map((loc) => parseInt(loc.waitingTime, 10))
      .filter((m) => !Number.isNaN(m));
    if (!times.length) return null;
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }, [locations]);

  // Total travel stats for the selected parking:
  // carMinutes + walkMinutes + searchMinutes = totalMinutes
  const travelStatsForSelected = useMemo(() => {
    if (!selectedParking || !directionsCar || !directionsWalk) return null;

    const carRoute = directionsCar.routes?.[0];
    const walkRoute = directionsWalk.routes?.[0];
    if (!carRoute || !walkRoute) return null;

    const carSeconds = (carRoute.legs || []).reduce(
      (sum, leg) => sum + (leg.duration?.value || 0),
      0
    );
    const walkSeconds = (walkRoute.legs || []).reduce(
      (sum, leg) => sum + (leg.duration?.value || 0),
      0
    );

    const carMinutes = carSeconds / 60;
    const walkMinutes = walkSeconds / 60;

    const rawSearch = parseInt(selectedParking.waitingTime, 10);
    const hasSearch = !Number.isNaN(rawSearch);
    const searchMinutes = hasSearch ? rawSearch : 0;

    const totalMinutes = carMinutes + walkMinutes + searchMinutes;

    return {
      carMinutes,
      walkMinutes,
      searchMinutes: hasSearch ? searchMinutes : null,
      totalMinutes,
    };
  }, [selectedParking, directionsCar, directionsWalk]);

  // "Start" button → notify parent + open Google Maps driving directions
  const handleStartNavigation = useCallback(() => {
    if (!userLocation || !selectedParking) return;

    // Compute saved time in minutes (average total trip - actual total trip)
    let savedTimeMinutes = null;
    if (
      travelStatsForSelected &&
      typeof averageSearchTimeMinutes === "number" &&
      !Number.isNaN(averageSearchTimeMinutes)
    ) {
      const { carMinutes, walkMinutes, totalMinutes } = travelStatsForSelected;
      const avgTotalMinutes =
        averageSearchTimeMinutes + carMinutes + walkMinutes;
      savedTimeMinutes = Math.round(avgTotalMinutes - totalMinutes);
    }

    // Notify parent so it can call /history and update UI
    if (
      typeof onStartTrip === "function" &&
      selectedParking.id != null &&
      typeof savedTimeMinutes === "number" &&
      !Number.isNaN(savedTimeMinutes)
    ) {
      onStartTrip({
        parkingId: selectedParking.id,
        savedTimeMinutes,
      });
    }

    const origin = `${userLocation.lat},${userLocation.lng}`;
    const dest = `${selectedParking.lat},${selectedParking.lng}`;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(dest)}&travelmode=driving`;

    window.open(url, "_blank");
  }, [
    userLocation,
    selectedParking,
    onStartTrip,
    travelStatsForSelected,
    averageSearchTimeMinutes,
  ]);

  if (loadError) return <div>Map Load Error: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading Google Maps…</div>;

  const canRoute =
    !!userLocation &&
    !!destination &&
    !!selectedParking &&
    typeof userLocation.lat === "number" &&
    typeof destination.lat === "number";

  const walkingLineSymbol = {
    path: "M 0,-1 0,1",
    strokeOpacity: 1,
    strokeColor: "#1a73e8",
    scale: 4,
  };

  const startDisabled = !userLocation || !selectedParking;

  return (
    <>
      {/* ----- MAP + ROUTES ----- */}
      <GoogleMap
        key={`${center.lat}-${center.lng}-${effectiveZoom}`}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={effectiveZoom}
        options={{
          styles: hiddenMapStyle,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {/* Car: user → parking */}
        {canRoute && !directionsCar && (
          <DirectionsService
            options={{
              origin: userLocation,
              destination: {
                lat: selectedParking.lat,
                lng: selectedParking.lng,
              },
              travelMode: window.google.maps.TravelMode.DRIVING,
            }}
            callback={(res) => {
              if (!res || res.status !== "OK") return;
              setDirectionsCar(res);
            }}
          />
        )}

        {directionsCar && (
          <DirectionsRenderer
            directions={directionsCar}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#1a73e8",
                strokeOpacity: 0.95,
                strokeWeight: 6,
              },
            }}
          />
        )}

        {/* Walk: parking → destination */}
        {canRoute && !directionsWalk && (
          <DirectionsService
            options={{
              origin: {
                lat: selectedParking.lat,
                lng: selectedParking.lng,
              },
              destination: destination,
              travelMode: window.google.maps.TravelMode.WALKING,
            }}
            callback={(res) => {
              if (!res || res.status !== "OK") return;
              setDirectionsWalk(res);
            }}
          />
        )}

        {directionsWalk && (
          <DirectionsRenderer
            directions={directionsWalk}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#1a73e8",
                strokeOpacity: 0,
                strokeWeight: 4,
                icons: [
                  {
                    icon: walkingLineSymbol,
                    offset: "0",
                    repeat: "14px",
                  },
                ],
              },
            }}
          />
        )}

        {/* Parking markers */}
        {locations.map((location, index) => (
          <Marker
            key={index}
            position={{ lat: location.lat, lng: location.lng }}
            onClick={() => handleMarkerClick(location)}
            icon={{
              ...getMarkerIcon(location.waitingTime),
              labelOrigin: new window.google.maps.Point(12, -6),
            }}
            label={{
              text: `${parseInt(location.waitingTime, 10)}m`,
              color: "#0f172a",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            {!isMobile && activeMarker === location && (
              <InfoWindow
                position={{ lat: location.lat, lng: location.lng }}
                onCloseClick={handleCloseClick}
              >
                <MarkerInfoContent location={location} />
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* User marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={destination}
            icon={{
              path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>

      {/* ----- MOBILE BOTTOM SHEET ----- */}
      {isMobile && activeMarker && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backgroundColor: "white",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            boxShadow: "0 -10px 30px rgba(15, 23, 42, 0.25)",
            padding: "12px 16px 18px",
            height: "40vh",
            maxHeight: "50vh",
            minHeight: "40vh",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Handle */}
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "999px",
              backgroundColor: "#e5e7eb",
              margin: "0 auto 4px",
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#9ca3af",
                  fontWeight: 600,
                  marginBottom: "2px",
                }}
              >
                Parking spot
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {activeMarker.label || "Unnamed parking spot"}
              </div>
            </div>

            <button
              onClick={handleCloseClick}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px",
                margin: 0,
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1,
                color: "#6b7280",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Scrollable content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingTop: "4px",
              paddingBottom: "4px",
            }}
          >
            {/* Cards row */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "8px",
                flexWrap: "wrap",
              }}
            >
              {/* Total travel card */}
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  borderRadius: "12px",
                  padding: "8px 10px",
                  minWidth: "160px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#60a5fa",
                    marginBottom: "2px",
                    fontWeight: 600,
                  }}
                >
                  Total travel time
                </div>
                {travelStatsForSelected ? (
                  <>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1d4ed8",
                        marginBottom: "2px",
                      }}
                    >
                      {Math.round(travelStatsForSelected.totalMinutes)} min
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#1d4ed8",
                      }}
                    >
                      Car {Math.round(travelStatsForSelected.carMinutes)} min ·
                      Walk {Math.round(travelStatsForSelected.walkMinutes)} min
                      {travelStatsForSelected.searchMinutes != null && (
                        <> · Search {travelStatsForSelected.searchMinutes} min</>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#1d4ed8",
                    }}
                  >
                    Calculating route…
                  </div>
                )}
              </div>

              {/* Comparison card (search + total) */}
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  borderRadius: "12px",
                  padding: "8px 10px",
                  flex: 1,
                  minWidth: "160px",
                }}
              >
                {(() => {
                  const spotMinutes = parseInt(activeMarker.waitingTime, 10);
                  const hasSpot = !Number.isNaN(spotMinutes);
                  const hasAvgSearch =
                    typeof averageSearchTimeMinutes === "number" &&
                    !Number.isNaN(averageSearchTimeMinutes);

                  return (
                    <>
                      <div
                        style={{
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: "#9ca3af",
                          marginBottom: "4px",
                          fontWeight: 600,
                        }}
                      >
                        Compared to others
                      </div>

                      {/* Search time comparison */}
                      {hasSpot && hasAvgSearch ? (
                        (() => {
                          const avgSearchRounded = Math.round(
                            averageSearchTimeMinutes
                          );
                          const diffSearch = Math.round(
                            averageSearchTimeMinutes - spotMinutes
                          );

                          let label;
                          let color;

                          if (diffSearch > 0) {
                            label = `Saves ${diffSearch} min search`;
                            color = "#16a34a";
                          } else if (diffSearch < 0) {
                            label = `${Math.abs(
                              diffSearch
                            )} min slower search`;
                            color = "#dc2626";
                          } else {
                            label = "Search time around average";
                            color = "#6b7280";
                          }

                          return (
                            <>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                }}
                              >
                                Avg search:{" "}
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "#111827",
                                  }}
                                >
                                  {avgSearchRounded} min
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color,
                                  marginBottom: "4px",
                                }}
                              >
                                {label}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginBottom: "4px",
                          }}
                        >
                          Not enough data to compare search time.
                        </div>
                      )}

                      {/* Total trip comparison */}
                      {travelStatsForSelected &&
                      hasAvgSearch &&
                      travelStatsForSelected.searchMinutes != null ? (
                        (() => {
                          const {
                            carMinutes,
                            walkMinutes,
                            totalMinutes,
                          } = travelStatsForSelected;

                          const avgTotalMinutes =
                            averageSearchTimeMinutes +
                            carMinutes +
                            walkMinutes;

                          const avgTotalRounded = Math.round(
                            avgTotalMinutes
                          );
                          const diffTotal = Math.round(
                            avgTotalMinutes - totalMinutes
                          );

                          let label;
                          let color;

                          if (diffTotal > 0) {
                            label = `Saves ${diffTotal} min overall trip`;
                            color = "#16a34a";
                          } else if (diffTotal < 0) {
                            label = `${Math.abs(
                              diffTotal
                            )} min slower overall trip`;
                            color = "#dc2626";
                          } else {
                            label = "Total trip around average";
                            color = "#6b7280";
                          }

                          return (
                            <>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginTop: "4px",
                                }}
                              >
                                Avg total trip:{" "}
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "#111827",
                                  }}
                                >
                                  {avgTotalRounded} min
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color,
                                }}
                              >
                                {label}
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "2px",
                          }}
                        >
                          Waiting for route to compare total trip…
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Coordinates */}
            <div
              style={{
                marginTop: "4px",
                fontSize: "11px",
                color: "#9ca3af",
              }}
            >
              {activeMarker.lat.toFixed(4)}, {activeMarker.lng.toFixed(4)}
            </div>
          </div>

          {/* Start button at bottom */}
          <button
            onClick={handleStartNavigation}
            disabled={startDisabled}
            style={{
              marginTop: "4px",
              width: "100%",
              border: "none",
              borderRadius: "999px",
              padding: "10px 14px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: startDisabled ? "default" : "pointer",
              opacity: startDisabled ? 0.6 : 1,
              background:
                "linear-gradient(135deg, rgba(59,130,246,1), rgba(129,140,248,1))",
              color: "white",
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
            }}
          >
            Start
          </button>
        </div>
      )}
    </>
  );
}

export default MapComponent;
