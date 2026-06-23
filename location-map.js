const LOCATION_STORAGE_KEY = "selected-map-location";
const DEFAULT_LOCATION = {
  name: "Ghaziabad 201009",
  lat: 28.6692,
  lng: 77.4538
};

function formatCoordinates(lat, lng) {
  return `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`;
}

function buildDeliveryText(location) {
  return `Delivering to ${location.name}`;
}

function getSavedLocation() {
  const rawLocation = localStorage.getItem(LOCATION_STORAGE_KEY);

  if (!rawLocation) {
    return DEFAULT_LOCATION;
  }

  try {
    return { ...DEFAULT_LOCATION, ...JSON.parse(rawLocation) };
  } catch (error) {
    return DEFAULT_LOCATION;
  }
}

function saveLocation(location) {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

function updateLocationUI(location) {
  const deliveryText = document.querySelector(".delivery-text");
  const selectedLocationDisplay = document.getElementById("selectedLocationDisplay");
  const selectedCoordinates = document.getElementById("selectedCoordinates");
  const locationNameInput = document.getElementById("locationName");

  if (deliveryText) {
    deliveryText.textContent = buildDeliveryText(location);
  }

  if (selectedLocationDisplay) {
    selectedLocationDisplay.textContent = location.name;
  }

  if (selectedCoordinates) {
    selectedCoordinates.textContent = formatCoordinates(location.lat, location.lng);
  }

  if (locationNameInput) {
    locationNameInput.value = location.name;
  }
}

function createLocationMap() {
  const mapElement = document.getElementById("locationMap");

  if (!mapElement || typeof L === "undefined") {
    return;
  }

  const savedLocation = getSavedLocation();
  let selectedLocation = { ...savedLocation };

  const map = L.map("locationMap").setView([savedLocation.lat, savedLocation.lng], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const marker = L.marker([savedLocation.lat, savedLocation.lng]).addTo(map);
  updateLocationUI(savedLocation);

  const commitLocation = (lat, lng, nameOverride) => {
    const enteredName = (nameOverride || document.getElementById("locationName")?.value || "").trim();

    selectedLocation = {
      name: enteredName || `Custom location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      lat,
      lng
    };

    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], 13);
    updateLocationUI(selectedLocation);
    saveLocation(selectedLocation);
  };

  map.on("click", (event) => {
    commitLocation(event.latlng.lat, event.latlng.lng);
  });

  document.getElementById("saveLocationBtn")?.addEventListener("click", () => {
    commitLocation(selectedLocation.lat, selectedLocation.lng);
  });

  document.getElementById("useCurrentLocationBtn")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      commitLocation(
        position.coords.latitude,
        position.coords.longitude,
        "My current location"
      );
    });
  });

  document.querySelector(".location")?.addEventListener("click", () => {
    document.getElementById("location-picker")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  document.addEventListener("language-applied", () => {
    updateLocationUI(getSavedLocation());
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 150);
}

document.addEventListener("DOMContentLoaded", createLocationMap);
