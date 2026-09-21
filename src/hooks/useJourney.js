import { useCallback, useEffect, useReducer } from 'react';
import {
  startJourney,
  updateJourneyLocation,
  stopJourney,
  JourneyStatus
} from '../services/journeyEngine.js';
import { showArrivalNotification } from '../services/notifications.js';

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
 * arrival detection, and stop/reset. Fires the arrival notification exactly
 * once when the journey transitions into ARRIVED.
 */
export function useJourney() {
  const [journey, dispatch] = useReducer(reducer, null);

  const start = useCallback((boardingStation, destinationStation) => {
    dispatch({ type: 'START', boardingStation, destinationStation });
  }, []);

  const reportPosition = useCallback((position) => {
    dispatch({ type: 'POSITION_UPDATE', position });
  }, []);

  const stop = useCallback(() => dispatch({ type: 'STOP' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // Fire the notification exactly once, right when arrival is confirmed.
  useEffect(() => {
    if (journey?.status === JourneyStatus.ARRIVED) {
      showArrivalNotification(journey.destinationStation.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.status]);

  return {
    journey,
    isActive: journey != null && journey.status !== JourneyStatus.STOPPED,
    start,
    reportPosition,
    stop,
    reset
  };
}
