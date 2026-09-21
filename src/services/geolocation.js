/**
 * Thin wrapper around navigator.geolocation. Keeps all direct browser API
 * access in one place so the rest of the app (and demo mode) never touches
 * `navigator.geolocation` directly.
 */

export const GEO_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 15000
};

export function isGeolocationSupported() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Resolve once with the current position.
 * @returns {Promise<GeolocationPosition>}
 */
export function requestCurrentLocation(options = GEO_OPTIONS) {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Start watching the device position. Returns the watch id needed to stop.
 * @param {(position: GeolocationPosition) => void} onUpdate
 * @param {(error: GeolocationPositionError) => void} onError
 * @returns {number|null} watchId, or null if unsupported
 */
export function watchLocation(onUpdate, onError, options = GEO_OPTIONS) {
  if (!isGeolocationSupported()) {
    onError?.(new Error('unsupported'));
    return null;
  }
  return navigator.geolocation.watchPosition(onUpdate, onError, options);
}

export function stopWatchingLocation(watchId) {
  if (watchId != null && isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
  }
}
