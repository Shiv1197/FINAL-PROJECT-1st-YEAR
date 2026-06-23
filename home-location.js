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

function updateHomeLocation() {
  const deliveryText = document.querySelector(".delivery-text");

  if (!deliveryText) {
    return;
  }

  const savedLocation = getSavedLocation();
  deliveryText.textContent = `Delivering to ${savedLocation.name}`;
}

document.addEventListener("DOMContentLoaded", updateHomeLocation);
document.addEventListener("language-applied", updateHomeLocation);
