import stationData from '../data/metroStations.json';
import { calculateDistanceMeters } from './distance.js';

export const ALL_STATIONS = stationData.stations;

// Maximum distance (meters) within which we'll confidently auto-detect a
// boarding station. Beyond this the user is almost certainly not near any
// station and should fall back to manual selection.
export const MAX_DETECTION_DISTANCE_METERS = 1000;

/**
 * Find the single nearest station to a given coordinate, plus its distance.
 * @returns {{ station: object, distanceMeters: number } | null}
 */
export function findNearestStation(latitude, longitude, stations = ALL_STATIONS) {
  if (!stations.length) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const station of stations) {
    const d = calculateDistanceMeters(latitude, longitude, station.latitude, station.longitude);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearest = station;
    }
  }

  return { station: nearest, distanceMeters: nearestDistance };
}

/**
 * Find the nearest station only if it's within MAX_DETECTION_DISTANCE_METERS.
 * Returns null if nothing is confidently close enough (caller should show
 * the manual-selection fallback).
 */
export function detectBoardingStation(latitude, longitude) {
  const result = findNearestStation(latitude, longitude);
  if (!result) return null;
  if (result.distanceMeters > MAX_DETECTION_DISTANCE_METERS) return null;
  return result;
}

/**
 * All stations within a given radius, sorted nearest-first.
 */
export function findStationsWithinRadius(latitude, longitude, radiusMeters, stations = ALL_STATIONS) {
  return stations
    .map((station) => ({
      station,
      distanceMeters: calculateDistanceMeters(latitude, longitude, station.latitude, station.longitude)
    }))
    .filter((entry) => entry.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Case-insensitive search by name or alias. De-duplicates stations that
 * appear twice because they sit on two lines (e.g. Ameerpet, MG Bus Station,
 * Parade Ground) by name, preferring the entry with more interchange info.
 */
export function searchStations(query, stations = ALL_STATIONS) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const matches = stations.filter((station) => {
    if (station.name.toLowerCase().includes(q)) return true;
    return station.aliases?.some((alias) => alias.toLowerCase().includes(q));
  });

  const byName = new Map();
  for (const station of matches) {
    const existing = byName.get(station.name);
    if (!existing || station.interchange.length > existing.interchange.length) {
      byName.set(station.name, station);
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getStationById(id, stations = ALL_STATIONS) {
  return stations.find((s) => s.id === id) || null;
}
