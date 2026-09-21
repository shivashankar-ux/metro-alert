import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_STATIONS } from '../services/stationDetection.js';

/**
 * Debug/testing screen for simulating GPS movement between two stations
 * without physically traveling. Disabled by default; only reachable via the
 * "Demo Mode" link. Completely separate from production geolocation logic —
 * the parent (App) simply swaps the real GPS hook's output for a simulated
 * position while this panel is open, and nothing here touches
 * navigator.geolocation.
 */
export default function DemoModePanel({ onClose, onSimulatedPosition, onExitDemo }) {
  const stationOptions = useMemo(
    () => [...ALL_STATIONS].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const [startId, setStartId] = useState(stationOptions[0]?.id ?? '');
  const [endId, setEndId] = useState(stationOptions[1]?.id ?? '');
  const [progress, setProgress] = useState(0); // 0..1 along the straight line
  const [simulatedAccuracy, setSimulatedAccuracy] = useState(20);
  const [playing, setPlaying] = useState(false);

  const start = stationOptions.find((s) => s.id === startId);
  const end = stationOptions.find((s) => s.id === endId);

  const progressRef = useRef(progress);
  progressRef.current = progress;

  function emitPosition(p, forceTriple = false) {
    if (!start || !end) return;
    const lat = start.latitude + (end.latitude - start.latitude) * p;
    const lon = start.longitude + (end.longitude - start.longitude) * p;
    const acc = Number(simulatedAccuracy);
    const now = Date.now();

    if (forceTriple || p >= 0.95 || p === 0.85) {
      // Emit 3 consecutive fixes with small timestamp increments so
      // journeyEngine's REQUIRED_CONSECUTIVE_READINGS check passes.
      for (let i = 0; i < 3; i++) {
        onSimulatedPosition(
          {
            coords: { latitude: lat, longitude: lon, accuracy: acc },
            timestamp: now + i * 200
          },
          start,
          end
        );
      }
    } else {
      onSimulatedPosition(
        {
          coords: { latitude: lat, longitude: lon, accuracy: acc },
          timestamp: now
        },
        start,
        end
      );
    }
  }

  // Auto-emit starting position when demo opens or stations change
  useEffect(() => {
    emitPosition(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startId, endId]);

  function handleSlider(value) {
    setProgress(value);
    emitPosition(value);
  }

  function jumpTo(target) {
    setProgress(target);
    emitPosition(target, true);
    if (target === 1) {
      setTimeout(() => {
        onClose();
      }, 400);
    }
  }

  // Auto-play: nudges progress forward on an interval while `playing` is on.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      const next = Math.min(1, progressRef.current + 0.05);
      handleSlider(next);
      if (next >= 1) {
        setPlaying(false);
        setTimeout(() => onClose(), 400);
      }
    }, 400);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, start?.id, end?.id, simulatedAccuracy]);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-y-auto">
      <div className="max-w-md mx-auto px-5 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Demo Mode</h2>
          <button onClick={onClose} className="text-sm text-gray-400">
            Close
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Simulate movement between two stations to test detection, approaching, and arrival
          states without traveling. This is completely separate from the production GPS logic.
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Starting station
            <select
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2.5 px-3"
            >
              {stationOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.line})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Destination station
            <select
              value={endId}
              onChange={(e) => setEndId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2.5 px-3"
            >
              {stationOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.line})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Simulated GPS accuracy (m)
            <input
              type="number"
              min="1"
              max="500"
              value={simulatedAccuracy}
              onChange={(e) => setSimulatedAccuracy(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2.5 px-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Position along route: {Math.round(progress * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => handleSlider(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => jumpTo(0)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium"
            >
              At start
            </button>
            <button
              onClick={() => jumpTo(0.85)}
              className="flex-1 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-medium"
            >
              Trigger approaching
            </button>
            <button
              onClick={() => jumpTo(1)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium"
            >
              Trigger arrival
            </button>
          </div>

          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium"
          >
            {playing ? 'Pause auto-play' : 'Auto-play toward destination'}
          </button>
        </div>

        <button
          onClick={onExitDemo}
          className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400"
        >
          Exit demo mode entirely
        </button>
      </div>
    </div>
  );
}
