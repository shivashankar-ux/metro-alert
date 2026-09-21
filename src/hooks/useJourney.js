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

function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return startJourney(action.boardingStation, action.destinationStation);
    case 'POSITION_UPDATE':
      return state ? updateJourneyLocation(state, action.position) : state;
    case 'STOP':
      return state ? stopJourney(state) : state;
    case 'RESET':
      return null;
    default:
      return state;
  }
}

/**
 * Manage the active journey: start, live position updates, approaching /
 * arrival detection, and stop/reset.
 */
export function useJourney() {
  const [journey, dispatch] = useReducer(reducer, null);
  const prevStatusRef = useRef(null);

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
