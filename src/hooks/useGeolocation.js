import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isGeolocationSupported,
  requestCurrentLocation,
  watchLocation,
  stopWatchingLocation
} from '../services/geolocation.js';

/**
 * Manages browser GPS access: permission/status, current reading, and an
 * optional continuous watch. When a demoPosition is supplied (demo mode),
 * that value is used instead of the real GPS.
 */
export function useGeolocation({ demoPosition = null } = {}) {
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied | unavailable | timeout | unsupported
  const [position, setPosition] = useState(null); // { coords: {latitude, longitude, accuracy}, timestamp }
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  const supported = isGeolocationSupported();

  const requestOnce = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return null;
    }
    setStatus('requesting');
    setError(null);
    try {
      const pos = await requestCurrentLocation();
      const normalized = normalizePosition(pos);
      setPosition(normalized);
      setStatus('granted');
      return normalized;
    } catch (err) {
      handleError(err, setStatus, setError);
      return null;
    }
  }, [supported]);

  const startWatching = useCallback(() => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    if (watchIdRef.current != null) return; // already watching
    setStatus((prev) => (prev === 'granted' ? prev : 'requesting'));
    watchIdRef.current = watchLocation(
      (pos) => {
        setPosition(normalizePosition(pos));
        setStatus('granted');
        setError(null);
      },
      (err) => handleError(err, setStatus, setError)
    );
  }, [supported]);

  const stopWatching = useCallback(() => {
    stopWatchingLocation(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  // Demo mode overrides real GPS entirely.
  useEffect(() => {
    if (demoPosition) {
      setPosition(demoPosition);
      setStatus('granted');
      setError(null);
    }
  }, [demoPosition]);

  return {
    supported,
    status,
    position: demoPosition || position,
    error,
    requestOnce,
    startWatching,
    stopWatching,
    isWatching: watchIdRef.current != null
  };
}

function normalizePosition(pos) {
  return {
    coords: {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    },
    timestamp: pos.timestamp ?? Date.now()
  };
}

function handleError(err, setStatus, setError) {
  setError(err);
  if (err?.message === 'unsupported') {
    setStatus('unsupported');
    return;
  }
  switch (err?.code) {
    case 1: // PERMISSION_DENIED
      setStatus('denied');
      break;
    case 2: // POSITION_UNAVAILABLE
      setStatus('unavailable');
      break;
    case 3: // TIMEOUT
      setStatus('timeout');
      break;
    default:
      setStatus('unavailable');
  }
}
