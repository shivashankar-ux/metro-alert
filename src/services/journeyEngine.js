import { calculateDistanceMeters } from './distance.js';

export const WARNING_RADIUS_METERS = 500;
export const ARRIVAL_RADIUS_METERS = 150;
export const REQUIRED_CONSECUTIVE_READINGS = 3;

export const PREFERRED_ACCURACY_METERS = 50;
export const MAX_ACCEPTABLE_ACCURACY_METERS = 100;

// A GPS fix older than this (relative to now) is considered stale and is
// ignored for arrival verification.
const MAX_READING_AGE_MS = 20000;

// If two consecutive fixes imply a speed faster than this, treat the newer
// fix as a GPS jump/glitch rather than real movement.
const MAX_PLAUSIBLE_SPEED_MPS = 55; // ~198 km/h, generous ceiling for a moving train/vehicle

export const JourneyStatus = {
  IDLE: 'idle',
  ACTIVE: 'active',
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  STOPPED: 'stopped'
};

/**
 * Create a fresh journey state.
 */
export function startJourney(boardingStation, destinationStation) {
  return {
    boardingStation,
    destinationStation,
    status: JourneyStatus.ACTIVE,
    distanceToDestinationMeters: calculateDistanceMeters(
      boardingStation.latitude,
      boardingStation.longitude,
      destinationStation.latitude,
      destinationStation.longitude
    ),
    consecutiveArrivalReadings: 0,
    lastAcceptedReading: null,
    lastRejectedReason: null,
    startedAt: Date.now()
  };
}

function isReadingStale(position) {
  if (!position?.timestamp) return false;
  return Date.now() - position.timestamp > MAX_READING_AGE_MS;
}

function isAccuracyAcceptable(position) {
  const accuracy = position?.coords?.accuracy;
  if (accuracy == null) return true; // some environments don't report accuracy
  return accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS;
}

function isImplausibleJump(previousReading, position) {
  if (!previousReading) return false;
  const dt = (position.timestamp - previousReading.timestamp) / 1000;
  if (dt <= 0) return false;
  const dist = calculateDistanceMeters(
    previousReading.coords.latitude,
    previousReading.coords.longitude,
    position.coords.latitude,
    position.coords.longitude
  );
  const impliedSpeed = dist / dt;
  return impliedSpeed > MAX_PLAUSIBLE_SPEED_MPS;
}

/**
 * Advance journey state given a new raw GeolocationPosition-like reading.
 * Pure function: returns a new state object, never mutates the input.
 *
 * position shape: { coords: { latitude, longitude, accuracy }, timestamp }
 */
export function updateJourneyLocation(state, position) {
  if (!state || state.status === JourneyStatus.STOPPED || state.status === JourneyStatus.ARRIVED) {
    return state;
  }

  // --- Anti-false-trigger checks -------------------------------------
  if (isReadingStale(position)) {
    return { ...state, lastRejectedReason: 'stale-timestamp' };
  }
  if (!isAccuracyAcceptable(position)) {
    return { ...state, lastRejectedReason: 'poor-accuracy' };
  }
  if (isImplausibleJump(state.lastAcceptedReading, position)) {
    return { ...state, lastRejectedReason: 'implausible-jump' };
  }

  // --- Reading accepted: recompute distance and status ----------------
  const distanceToDestinationMeters = calculateDistanceMeters(
    position.coords.latitude,
    position.coords.longitude,
    state.destinationStation.latitude,
    state.destinationStation.longitude
  );

  const withinArrivalRadius = distanceToDestinationMeters <= ARRIVAL_RADIUS_METERS;
  const consecutiveArrivalReadings = withinArrivalRadius ? state.consecutiveArrivalReadings + 1 : 0;

  let status = state.status;
  if (withinArrivalRadius && consecutiveArrivalReadings >= REQUIRED_CONSECUTIVE_READINGS) {
    status = JourneyStatus.ARRIVED;
  } else if (distanceToDestinationMeters <= WARNING_RADIUS_METERS) {
    status = JourneyStatus.APPROACHING;
  } else {
    status = JourneyStatus.ACTIVE;
  }

  return {
    ...state,
    status,
    distanceToDestinationMeters,
    consecutiveArrivalReadings,
    lastAcceptedReading: position,
    lastRejectedReason: null
  };
}

export function checkApproachingDestination(state) {
  return state?.status === JourneyStatus.APPROACHING;
}

export function checkDestinationArrival(state) {
  return state?.status === JourneyStatus.ARRIVED;
}

export function completeJourney(state) {
  return { ...state, status: JourneyStatus.ARRIVED };
}

export function stopJourney(state) {
  return { ...state, status: JourneyStatus.STOPPED };
}
