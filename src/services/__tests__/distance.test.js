import { describe, it, expect } from 'vitest';
import { calculateDistanceMeters, calculateDistanceKilometers, formatDistance } from '../distance.js';

describe('calculateDistanceMeters', () => {
  it('returns 0 for identical coordinates', () => {
    expect(calculateDistanceMeters(17.4374, 78.4483, 17.4374, 78.4483)).toBeCloseTo(0, 5);
  });

  it('computes a known real-world distance (Uppal to Ameerpet, ~9-10km)', () => {
    // Uppal: 17.3988, 78.5538 | Ameerpet: 17.4374, 78.4483
    const d = calculateDistanceMeters(17.3988, 78.5538, 17.4374, 78.4483);
    expect(d).toBeGreaterThan(8000);
    expect(d).toBeLessThan(13000);
  });

  it('is symmetric', () => {
    const a = calculateDistanceMeters(17.3988, 78.5538, 17.4374, 78.4483);
    const b = calculateDistanceMeters(17.4374, 78.4483, 17.3988, 78.5538);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('calculateDistanceKilometers', () => {
  it('is meters / 1000', () => {
    const meters = calculateDistanceMeters(17.3988, 78.5538, 17.4374, 78.4483);
    const km = calculateDistanceKilometers(17.3988, 78.5538, 17.4374, 78.4483);
    expect(km).toBeCloseTo(meters / 1000, 6);
  });
});

describe('formatDistance', () => {
  it('formats sub-km distances in meters', () => {
    expect(formatDistance(150)).toBe('150 m');
  });
  it('formats km distances with one decimal', () => {
    expect(formatDistance(1800)).toBe('1.8 km');
  });
  it('handles null/NaN gracefully', () => {
    expect(formatDistance(null)).toBe('—');
    expect(formatDistance(NaN)).toBe('—');
  });
});
