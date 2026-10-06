import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isGeolocationSupported,
  requestCurrentLocation,
  watchLocation,
  stopWatchingLocation
} from '../services/geolocation.js';

/**
 * Manages browser GPS access: permission/status, current reading, and an
 * optional continuous watch with auto-recovery for PWA background/sleep states.
 * When a demoPosition is supplied (demo mode), that value is used instead of real GPS.
 */
export function useGeolocation({ demoPosition = null } = {}) {
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied | unavailable | timeout | unsupported
  const [position, setPosition] = useState(null); // { coords: {latitude, longitude, accuracy}, timestamp }
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const lastPositionTimeRef = useRef(0);

  const supported = isGeolocationSupported();

  const requestOnce = useCallback(async (options) => {
    if (!supported) {
      setStatus('unsupported');
      return null;
    }
    setStatus((prev) => (prev === 'granted' ? prev : 'requesting'));
    setError(null);
    try {
      const pos = await requestCurrentLocation(options);
      const normalized = normalizePosition(pos);
      setPosition(normalized);
      setStatus('granted');
      lastPositionTimeRef.current = Date.now();
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

    // Trigger an immediate request to get position right away
    requestOnce({ maximumAge: 0, timeout: 10000 });

    watchIdRef.current = watchLocation(
      (pos) => {
        setPosition(normalizePosition(pos));
        setStatus('granted');
        setError(null);
        lastPositionTimeRef.current = Date.now();
      },
      (err) => handleError(err, setStatus, setError)
    );

    // Heartbeat fallback: if watchPosition stops firing in background/sleep, pull current location
    if (heartbeatTimerRef.current == null) {
      heartbeatTimerRef.current = setInterval(() => {
        if (watchIdRef.current == null) return;
        const timeSinceLastFix = Date.now() - lastPositionTimeRef.current;
        if (timeSinceLastFix > 12000) {
          requestCurrentLocation({ maximumAge: 0, timeout: 10000 })
            .then((pos) => {
              setPosition(normalizePosition(pos));
              setStatus('granted');
              setError(null);
              lastPositionTimeRef.current = Date.now();
            })
            .catch(() => {});
        }
      }, 8000);
    }
  }, [supported, requestOnce]);

  const stopWatching = useCallback(() => {
    stopWatchingLocation(watchIdRef.current);
    watchIdRef.current = null;
    if (heartbeatTimerRef.current != null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  // Recover GPS fix immediately when PWA tab comes back from background / screen unlock
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && watchIdRef.current != null && !demoPosition) {
        requestOnce({ maximumAge: 0, timeout: 10000 });
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [demoPosition, requestOnce]);

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

