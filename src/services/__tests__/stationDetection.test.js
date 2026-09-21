import { describe, it, expect } from 'vitest';
import {
  ALL_STATIONS,
  findNearestStation,
  detectBoardingStation,
  findStationsWithinRadius,
  searchStations,
  getStationById
} from '../stationDetection.js';

describe('station dataset', () => {
  it('loads station entries covering all 57 physical stations (interchange stations have one entry per line)', () => {
    const uniqueNames = new Set(ALL_STATIONS.map((s) => s.name));
    expect(uniqueNames.size).toBe(57);
    // Ameerpet, Parade Ground and MG Bus Station each have two entries
    // (one per line they sit on), so the raw entry count is 57 + 3.
    expect(ALL_STATIONS.length).toBe(60);
  });

  it('every station has a valid id, coordinates and line', () => {
    for (const s of ALL_STATIONS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(typeof s.latitude).toBe('number');
      expect(typeof s.longitude).toBe('number');
      expect(['Red Line', 'Blue Line', 'Green Line']).toContain(s.line);
    }
  });
});

describe('findNearestStation', () => {
  it('finds Uppal when standing exactly on Uppal', () => {
    const uppal = getStationById('uppal');
    const result = findNearestStation(uppal.latitude, uppal.longitude);
    expect(result.station.id).toBe('uppal');
    expect(result.distanceMeters).toBeCloseTo(0, 3);
  });

  it('finds Ameerpet from a point very close to it', () => {
    const result = findNearestStation(17.4376, 78.4485);
    expect(result.station.name).toBe('Ameerpet');
  });
});

describe('detectBoardingStation', () => {
  it('detects a station within the max detection distance', () => {
    const uppal = getStationById('uppal');
    const result = detectBoardingStation(uppal.latitude, uppal.longitude);
    expect(result).not.toBeNull();
    expect(result.station.id).toBe('uppal');
  });

  it('returns null when far from every station', () => {
    // A point far out in open country, well beyond 1000m of any station.
    const result = detectBoardingStation(16.0, 79.5);
    expect(result).toBeNull();
  });
});

describe('findStationsWithinRadius', () => {
  it('returns stations within the given radius, nearest first', () => {
    const ameerpet = getStationById('ameerpet');
    const results = findStationsWithinRadius(ameerpet.latitude, ameerpet.longitude, 3000);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].station.id).toBe('ameerpet');
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distanceMeters).toBeGreaterThanOrEqual(results[i - 1].distanceMeters);
    }
  });
});

describe('searchStations', () => {
  it('matches by partial name, case-insensitively', () => {
    const results = searchStations('ameer');
    expect(results.some((s) => s.name === 'Ameerpet')).toBe(true);
  });

  it('matches by alias', () => {
    const results = searchStations('mgbs');
    expect(results.some((s) => s.name === 'MG Bus Station')).toBe(true);
  });

  it('de-duplicates stations that exist on two lines (e.g. Ameerpet)', () => {
    const results = searchStations('ameerpet');
    const count = results.filter((s) => s.name === 'Ameerpet').length;
    expect(count).toBe(1);
  });

  it('returns an empty array for an empty query', () => {
    expect(searchStations('')).toEqual([]);
  });

  it('returns no results for gibberish', () => {
    expect(searchStations('zzzzznotastation')).toEqual([]);
  });
});
