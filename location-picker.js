const LOCATION_STORAGE_KEY = "selected-map-location";
const DEFAULT_LOCATION = {
  name: "Ghaziabad 201009",
  lat: 28.6692,
  lng: 77.4538
};

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

function getPincodeLabel(code) {
  const trimmedCode = String(code || "").trim();
  return trimmedCode ? `Pincode ${trimmedCode}` : "";
}

function buildLocationName(address, fallback) {
  const rawParts = [
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.city || address.town || address.village || address.municipality,
    address.state_district,
    address.state
  ].filter(Boolean);

  const uniqueParts = rawParts.filter((part, index) => rawParts.indexOf(part) === index);
  return uniqueParts.length ? uniqueParts.join(", ") : fallback;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function lookupIndianPincode(pincode) {
  const primaryUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&postalcode=${encodeURIComponent(pincode)}&addressdetails=1&limit=1`;
  const primaryResults = await fetchJson(primaryUrl);

  if (Array.isArray(primaryResults) && primaryResults.length > 0) {
    const result = primaryResults[0];
    const address = result.address || {};

    return {
      name: buildLocationName(address, getPincodeLabel(pincode)),
      customName: "",
      pincode,
      lat: Number(result.lat),
      lng: Number(result.lon)
    };
  }

  const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(`${pincode}, India`)}&addressdetails=1&limit=1`;
  const fallbackResults = await fetchJson(fallbackUrl);

  if (!Array.isArray(fallbackResults) || fallbackResults.length === 0) {
    throw new Error("No location found for this pincode.");
  }

  const result = fallbackResults[0];
  const address = result.address || {};

  return {
    name: buildLocationName(address, getPincodeLabel(pincode)),
    customName: "",
    pincode,
    lat: Number(result.lat),
    lng: Number(result.lon)
  };
}

async function lookupLocationByName(query) {
  const cleanedQuery = String(query || "").trim();

  if (!cleanedQuery) {
    throw new Error("Please enter an area or location name.");
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&q=${encodeURIComponent(cleanedQuery)}&addressdetails=1&limit=1`;
  const results = await fetchJson(url);

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("No location found for this area.");
  }

  const result = results[0];
  const address = result.address || {};

  return {
    name: buildLocationName(address, cleanedQuery),
    customName: cleanedQuery,
    pincode: address.postcode || "",
    lat: Number(result.lat),
    lng: Number(result.lon)
  };
}

async function reverseLookupLocation(lat, lng, fallbackName) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1`;
  const result = await fetchJson(url);
  const address = result.address || {};

  return {
    name: buildLocationName(address, fallbackName),
    customName: "",
    pincode: address.postcode || "",
    lat: Number(lat),
    lng: Number(lng)
  };
}

function updateSelectedDetails(location) {
  const nameField = document.getElementById("locationName");
  const locationDisplay = document.getElementById("selectedLocationDisplay");
  const coordinatesDisplay = document.getElementById("selectedCoordinates");
  const pincodeInput = document.getElementById("pincodeInput");

  if (nameField) {
    nameField.value = location.customName || location.name;
  }

  if (locationDisplay) {
    locationDisplay.textContent = location.name;
  }

  if (coordinatesDisplay) {
    coordinatesDisplay.textContent = `Latitude: ${location.lat.toFixed(5)}, Longitude: ${location.lng.toFixed(5)}`;
  }

  if (pincodeInput) {
    pincodeInput.value = location.pincode || "";
  }
}

function goBackToHome() {
  window.location.href = "webpage-location.html";
}

function setupLocationPicker() {
  if (typeof L === "undefined") {
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
  updateSelectedDetails(savedLocation);

  const selectLocation = (lat, lng, forcedName, forcedPincode = "") => {
    const typedName = (forcedName || document.getElementById("locationName")?.value || "").trim();
    const typedPincode = (forcedPincode || document.getElementById("pincodeInput")?.value || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    const areaName = typedName || getPincodeLabel(typedPincode) || `Custom location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

    selectedLocation = {
      name: areaName,
      customName: typedName,
      pincode: typedPincode,
      lat,
      lng
    };

    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], 13);
    updateSelectedDetails(selectedLocation);
  };

  const setTemporaryStatus = (message) => {
    const coordinatesDisplay = document.getElementById("selectedCoordinates");

    if (coordinatesDisplay) {
      coordinatesDisplay.textContent = message;
    }
  };

  map.on("click", (event) => {
    selectLocation(event.latlng.lat, event.latlng.lng);
  });

  document.getElementById("saveLocationBtn")?.addEventListener("click", () => {
    saveLocation(selectedLocation);
    goBackToHome();
  });

  document.getElementById("useCurrentLocationBtn")?.addEventListener("click", async () => {
    if (!navigator.geolocation) {
      setTemporaryStatus("Geolocation is not supported in this browser.");
      return;
    }

    setTemporaryStatus("Fetching your current location...");

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const resolvedLocation = await reverseLookupLocation(
          position.coords.latitude,
          position.coords.longitude,
          "My current location"
        );

        selectedLocation = resolvedLocation;
        marker.setLatLng([resolvedLocation.lat, resolvedLocation.lng]);
        map.setView([resolvedLocation.lat, resolvedLocation.lng], 13);
        updateSelectedDetails(selectedLocation);
      } catch (error) {
        selectLocation(
          position.coords.latitude,
          position.coords.longitude,
          "My current location"
        );
      }
    }, () => {
      updateSelectedDetails(selectedLocation);
      setTemporaryStatus("Unable to get your current location.");
    });
  });

  document.getElementById("applyPincodeBtn")?.addEventListener("click", async () => {
    const pincode = (document.getElementById("pincodeInput")?.value || "").replace(/\D/g, "").slice(0, 6);

    if (pincode.length !== 6) {
      setTemporaryStatus("Please enter a valid 6-digit pincode.");
      return;
    }

    setTemporaryStatus("Looking up pincode location...");

    try {
      const resolvedLocation = await lookupIndianPincode(pincode);
      selectedLocation = resolvedLocation;
      marker.setLatLng([resolvedLocation.lat, resolvedLocation.lng]);
      map.setView([resolvedLocation.lat, resolvedLocation.lng], 13);
      updateSelectedDetails(selectedLocation);
    } catch (error) {
      updateSelectedDetails(selectedLocation);
      setTemporaryStatus("Pincode location not found. Try another valid Indian pincode.");
    }
  });

  document.getElementById("applyAreaBtn")?.addEventListener("click", async () => {
    const areaName = (document.getElementById("locationName")?.value || "").trim();

    if (!areaName) {
      setTemporaryStatus("Please enter an area or location name.");
      return;
    }

    setTemporaryStatus("Looking up area location...");

    try {
      const resolvedLocation = await lookupLocationByName(areaName);
      selectedLocation = resolvedLocation;
      marker.setLatLng([resolvedLocation.lat, resolvedLocation.lng]);
      map.setView([resolvedLocation.lat, resolvedLocation.lng], 13);
      updateSelectedDetails(selectedLocation);
    } catch (error) {
      updateSelectedDetails(selectedLocation);
      setTemporaryStatus("Area location not found. Try a more specific place name.");
    }
  });

  document.getElementById("cancelBtn")?.addEventListener("click", goBackToHome);

  setTimeout(() => {
    map.invalidateSize();
  }, 150);
}

document.addEventListener("DOMContentLoaded", setupLocationPicker);
