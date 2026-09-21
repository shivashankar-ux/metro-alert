import { useMemo, useState } from 'react';
import {
  ALL_STATIONS,
  detectBoardingStation,
  searchStations
} from '../services/stationDetection.js';

/**
 * Search and retrieve station data. Wraps the station list plus a live
 * search query, and exposes boarding-station detection from a coordinate.
 */
export function useStations() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchStations(query), [query]);

  return {
    allStations: ALL_STATIONS,
    query,
    setQuery,
    results,
    detectBoardingStation
  };
}
