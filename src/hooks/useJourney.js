import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  startJourney,
  updateJourneyLocation,
  stopJourney,
  JourneyStatus
} from '../services/journeyEngine.js';
import {
  showArrivalNotification,
  showApproachingNotification
} from '../services/notifications.js';

const STORAGE_KEY = 'metro_alert_active_journey';
const MAX_JOURNEY_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

function loadSavedJourney() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.status &&
      parsed.status !== JourneyStatus.STOPPED &&
      parsed.startedAt &&
      Date.now() - parsed.startedAt < MAX_JOURNEY_AGE_MS
    ) {
      return parsed;
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  return null;
}

function saveJourney(journey) {
  if (typeof window === 'undefined') return;
  try {
    if (journey && journey.status !== JourneyStatus.STOPPED) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

function reducer(state, action) {
  let nextState;
  switch (action.type) {
    case 'START':
      nextState = startJourney(action.boardingStation, action.destinationStation);
      break;
    case 'POSITION_UPDATE':
      nextState = state ? updateJourneyLocation(state, action.position) : state;
      break;
    case 'STOP':
      nextState = state ? stopJourney(state) : state;
      break;
    case 'RESET':
      nextState = null;
      break;
    default:
      nextState = state;
  }
  saveJourney(nextState);
  return nextState;
}

/**
 * Manage the active journey: start, live position updates, approaching /
 * arrival detection, and stop/reset.
 */
export function useJourney() {
  const [journey, dispatch] = useReducer(reducer, null, loadSavedJourney);
  const prevStatusRef = useRef(journey?.status || null);

  const start = useCallback((boardingStation, destinationStation) => {
    dispatch({ type: 'START', boardingStation, destinationStation });
  }, []);

  const reportPosition = useCallback((position) => {
    dispatch({ type: 'POSITION_UPDATE', position });
  }, []);

  const stop = useCallback(() => dispatch({ type: 'STOP' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Fire notifications and vibrations on status transitions
  useEffect(() => {
    const currentStatus = journey?.status;
    const prevStatus = prevStatusRef.current;

    if (currentStatus && currentStatus !== prevStatus) {
      if (currentStatus === JourneyStatus.APPROACHING) {
        showApproachingNotification(journey.destinationStation.name);
      } else if (currentStatus === JourneyStatus.ARRIVED) {
        showArrivalNotification(journey.destinationStation.name);
      }
    }

    prevStatusRef.current = currentStatus;
  }, [journey?.status, journey?.destinationStation?.name]);

  return {
    journey,
    isActive: journey != null && journey.status !== JourneyStatus.STOPPED,
    start,
    reportPosition,
    stop,
    reset
  };
}

