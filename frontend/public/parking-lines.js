function getCurrentLocation(callback) {
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by this browser.");
    callback(null);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      callback({ lat, lng }); // return as object
    },
    (error) => {
      console.error("Error getting location:", error);
      callback(null);
    }
  );
}

function initMap() {
  // First get current location
  getCurrentLocation((currentLoc) => {
    const mapCenter = currentLoc || { lat: 48.13513, lng: 11.58198 }; // fallback to Munich

    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 16,
      center: mapCenter,
    });

    // Define multiple lines as one continuous path
    const lineCoordinates = [
      { lat: 48.124408, lng: 11.579316 },
      { lat: 48.124182, lng: 11.579170 },
      { lat: 48.123861, lng: 11.578937 },
      { lat: 48.123768, lng: 11.578866 },
      { lat: 48.123700, lng: 11.578799 },
      { lat: 48.123538, lng: 11.578606 },
    ];

    const parkingLine = new google.maps.Polyline({
      path: lineCoordinates,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 3,
    });

    parkingLine.setMap(map);

        // Add marker for current location
    if (currentLoc) {
      const userMarker = new google.maps.Marker({
        position: currentLoc,
        map: map,
        title: "You are here",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      });

      // Optional: add accuracy circle
      const accuracyCircle = new google.maps.Circle({
        strokeColor: "#4285F4",
        strokeOpacity: 0.4,
        strokeWeight: 1,
        fillColor: "#4285F4",
        fillOpacity: 0.2,
        map: map,
        center: currentLoc,
        radius: position.coords.accuracy || 50, // meters
      });
    }
  });
}

window.initMap = initMap;

