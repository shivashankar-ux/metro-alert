import { describe, it, expect } from 'vitest';
import {
  startJourney,
  updateJourneyLocation,
  stopJourney,
  JourneyStatus,
  WARNING_RADIUS_METERS,
  ARRIVAL_RADIUS_METERS,
  REQUIRED_CONSECUTIVE_READINGS
} from '../journeyEngine.js';
import { getStationById } from '../stationDetection.js';

const boarding = getStationById('uppal');
const destination = getStationById('ameerpet');

function readingAt(lat, lon, opts = {}) {
  return {
    coords: { latitude: lat, longitude: lon, accuracy: opts.accuracy ?? 20 },
    timestamp: opts.timestamp ?? Date.now()
  };
}

describe('startJourney', () => {
  it('initializes an ACTIVE journey with a computed distance', () => {
    const journey = startJourney(boarding, destination);
    expect(journey.status).toBe(JourneyStatus.ACTIVE);
    expect(journey.distanceToDestinationMeters).toBeGreaterThan(0);
    expect(journey.consecutiveArrivalReadings).toBe(0);
  });
});

describe('updateJourneyLocation - warning radius', () => {
  it('transitions to APPROACHING within the warning radius but outside arrival radius', () => {
    let journey = startJourney(boarding, destination);
    // A point ~300m from the destination (between arrival and warning radii)
    const nearby = readingAt(destination.latitude + 0.0027, destination.longitude);
    journey = updateJourneyLocation(journey, nearby);
    expect(journey.distanceToDestinationMeters).toBeLessThan(WARNING_RADIUS_METERS);
    expect(journey.distanceToDestinationMeters).toBeGreaterThan(ARRIVAL_RADIUS_METERS);
    expect(journey.status).toBe(JourneyStatus.APPROACHING);
  });
});

describe('updateJourneyLocation - arrival verification', () => {
  it('does NOT arrive on a single reading inside the arrival radius', () => {
    let journey = startJourney(boarding, destination);
    const atDestination = readingAt(destination.latitude, destination.longitude);
    journey = updateJourneyLocation(journey, atDestination);
    expect(journey.status).not.toBe(JourneyStatus.ARRIVED);
    expect(journey.consecutiveArrivalReadings).toBe(1);
  });

  it('arrives after REQUIRED_CONSECUTIVE_READINGS consecutive readings inside the radius', () => {
    let journey = startJourney(boarding, destination);
    for (let i = 0; i < REQUIRED_CONSECUTIVE_READINGS; i++) {
      journey = updateJourneyLocation(
        journey,
        readingAt(destination.latitude, destination.longitude, { timestamp: Date.now() + i * 1000 })
      );
    }
    expect(journey.status).toBe(JourneyStatus.ARRIVED);
  });

  it('resets the consecutive counter when the user steps back outside the radius', () => {
    let journey = startJourney(boarding, destination);
    journey = updateJourneyLocation(journey, readingAt(destination.latitude, destination.longitude));
    journey = updateJourneyLocation(journey, readingAt(destination.latitude, destination.longitude));
    expect(journey.consecutiveArrivalReadings).toBe(2);

    // Step back out to warning-radius distance (enough time elapsed to stay
    // within the plausible-speed check).
    journey = updateJourneyLocation(
      journey,
      readingAt(destination.latitude + 0.003, destination.longitude, { timestamp: Date.now() + 10000 })
    );
    expect(journey.consecutiveArrivalReadings).toBe(0);
    expect(journey.status).not.toBe(JourneyStatus.ARRIVED);
  });
});

describe('updateJourneyLocation - anti-false-trigger', () => {
  it('ignores a reading with poor accuracy', () => {
    let journey = startJourney(boarding, destination);
    const before = journey.distanceToDestinationMeters;
    const poorReading = readingAt(destination.latitude, destination.longitude, { accuracy: 500 });
    journey = updateJourneyLocation(journey, poorReading);
    expect(journey.lastRejectedReason).toBe('poor-accuracy');
    expect(journey.distanceToDestinationMeters).toBe(before);
    expect(journey.consecutiveArrivalReadings).toBe(0);
  });

  it('ignores a stale reading', () => {
    let journey = startJourney(boarding, destination);
    const stale = readingAt(destination.latitude, destination.longitude, {
      timestamp: Date.now() - 60000
    });
    journey = updateJourneyLocation(journey, stale);
    expect(journey.lastRejectedReason).toBe('stale-timestamp');
  });

  it('ignores an implausible GPS jump between consecutive readings', () => {
    let journey = startJourney(boarding, destination);
    journey = updateJourneyLocation(journey, readingAt(boarding.latitude, boarding.longitude, { timestamp: Date.now() }));
    // "Teleporting" to the destination one second later is not physically
    // plausible for a metro rider.
    const jump = readingAt(destination.latitude, destination.longitude, {
      timestamp: journey.lastAcceptedReading.timestamp + 1000
    });
    journey = updateJourneyLocation(journey, jump);
    expect(journey.lastRejectedReason).toBe('implausible-jump');
  });
});

describe('stopJourney', () => {
  it('marks the journey as STOPPED and further updates are no-ops', () => {
    let journey = startJourney(boarding, destination);
    journey = stopJourney(journey);
    expect(journey.status).toBe(JourneyStatus.STOPPED);
    const after = updateJourneyLocation(journey, readingAt(destination.latitude, destination.longitude));
    expect(after.status).toBe(JourneyStatus.STOPPED);
  });
});
