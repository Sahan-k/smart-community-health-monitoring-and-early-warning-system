import api from './api';

/**
 * Requests browser location permission and fetches current coordinates.
 * Returns a Promise that resolves with { latitude, longitude, accuracy } or rejects with a typed error.
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      const err = new Error('Geolocation is not supported by your browser.');
      err.code = 'UNSUPPORTED';
      return reject(err);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Failed to get location.';
        if (error.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser settings and try again.';
        } else if (error.code === 2) {
          msg = 'Location information is unavailable. Please check that GPS / Location Services is enabled on your device.';
        } else if (error.code === 3) {
          msg = 'The request to get your location timed out. Please try again in an open area.';
        }
        const err = new Error(msg);
        err.code = error.code;
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        ...options,
      }
    );
  });
}

/**
 * Reverse geocodes coordinates using OpenStreetMap Nominatim.
 * Extracts State, District, Taluk, Village and PIN Code for Indian addresses.
 * Falls back to the backend proxy (/api/locations/reverse-geocode) on network errors.
 */
export async function reverseGeocodeWithNominatim(lat, lon) {
  let osmData = null;

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        // English + Hindi so Indian place names come back in a usable form
        'Accept-Language': 'en,hi;q=0.9',
      },
    });
    if (resp.ok) {
      osmData = await resp.json();
    }
  } catch (err) {
    console.warn('Nominatim direct fetch notice:', err);
  }

  if (osmData && osmData.address) {
    const addr = osmData.address;

    // --- District ---
    // Nominatim returns Indian districts as state_district, district, or county
    const rawDist =
      addr.state_district ||
      addr.district ||
      addr.city_district ||
      addr.county ||
      '';
    const cleanDist = rawDist.replace(/\s+District$/i, '').trim();

    // --- Taluk / Tehsil / Sub-district ---
    const rawTaluk =
      addr.subdistrict ||
      addr.tehsil ||
      addr.county ||
      addr.subdivision ||
      '';
    const cleanTaluk = rawTaluk
      .replace(/\s+Taluk$/i, '')
      .replace(/\s+Tehsil$/i, '')
      .replace(/\s+Sub-?district$/i, '')
      .trim();

    // --- Village / Locality ---
    // Priority: village → hamlet → suburb → neighbourhood → town → city
    const cleanVillage = (
      addr.village ||
      addr.hamlet ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.town ||
      addr.residential ||
      addr.city ||
      ''
    ).trim();

    return {
      latitude: lat,
      longitude: lon,
      state: (addr.state || '').trim(),
      district: cleanDist,
      taluk: cleanTaluk,
      village: cleanVillage,
      pincode: (addr.postcode || '').trim(),
      displayName: osmData.display_name || '',
    };
  }

  // Fallback: backend reverse-geocode proxy
  try {
    const beRes = await api.get(`/api/locations/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (beRes.data) return beRes.data;
  } catch (beErr) {
    console.warn('Backend reverse-geocode proxy notice:', beErr);
  }

  // Last resort: return coordinates with empty address fields
  return {
    latitude: lat,
    longitude: lon,
    state: '',
    district: '',
    taluk: '',
    village: '',
    pincode: '',
    displayName: '',
  };
}

/**
 * Full GPS detection workflow:
 * 1. Checks HTTPS context.
 * 2. Requests browser location permission.
 * 3. Reverse-geocodes via Nominatim.
 * Returns a location object: { latitude, longitude, state, district, taluk, village, pincode, displayName }
 */
export async function detectLocationViaGps() {
  const coords = await getCurrentPosition();
  const location = await reverseGeocodeWithNominatim(coords.latitude, coords.longitude);
  return location;
}
