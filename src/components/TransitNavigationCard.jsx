import { useMemo, useState } from 'react';
import { getIntermediateStops } from '../services/stationDetection.js';
import { JourneyStatus } from '../services/journeyEngine.js';
import GPSStatus from './GPSStatus.jsx';

export default function TransitNavigationCard({
  journey,
  onStop,
  geoStatus,
  accuracy,
  isWatching,
  demoMode
}) {
  const [showIntermediateStops, setShowIntermediateStops] = useState(false);
  const [showPreviousSteps, setShowPreviousSteps] = useState(false);

  const boardingStation = journey?.boardingStation;
  const destinationStation = journey?.destinationStation;

  const routeInfo = useMemo(() => {
    return getIntermediateStops(boardingStation, destinationStation);
  }, [boardingStation, destinationStation]);

  // Compute live ETA time string
  const etaTimeString = useMemo(() => {
    const totalMinutes = routeInfo.estimatedMinutes || 10;
    const now = new Date();
    now.setMinutes(now.getMinutes() + totalMinutes);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [routeInfo.estimatedMinutes]);

  // Compute progress percentage along vertical route line
  const progressPercent = useMemo(() => {
    if (!journey) return 0;
    const initialDist = journey.startedAtDistanceMeters || (routeInfo.stopsCount * 1200) || 5000;
    const currentDist = journey.distanceToDestinationMeters ?? initialDist;
    const percent = Math.max(5, Math.min(92, ((initialDist - currentDist) / initialDist) * 100));
    return journey.status === JourneyStatus.ARRIVED ? 95 : percent;
  }, [journey, routeInfo.stopsCount]);

  const lineBg = {
    'Red Line': 'bg-red-600',
    'Blue Line': 'bg-blue-600',
    'Green Line': 'bg-emerald-600'
  }[routeInfo.lineName] || 'bg-red-600';

  const lineText = {
    'Red Line': 'text-red-500',
    'Blue Line': 'text-blue-500',
    'Green Line': 'text-emerald-500'
  }[routeInfo.lineName] || 'text-red-500';

  const lineHex = routeInfo.lineHex;

  return (
    <div className="w-full max-w-md mx-auto bg-gray-950 text-white min-h-[90vh] flex flex-col justify-between p-4 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden font-sans">
      {/* --- Top Header Navigation Bar --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm ${lineBg}`}>
              {routeInfo.lineName}
            </span>
            <span className="text-xs text-gray-400">Hyderabad Metro</span>
          </div>
          <button
            onClick={onStop}
            className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition active:scale-95"
            title="End Journey"
          >
            ✕
          </button>
        </div>

        {/* Collapsible previous steps header */}
        <button
          onClick={() => setShowPreviousSteps((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition"
        >
          <span>{showPreviousSteps ? 'Hide previous steps' : 'Show previous steps'}</span>
          <span className="text-[10px]">{showPreviousSteps ? '▲' : '▼'}</span>
        </button>

        {showPreviousSteps && (
          <div className="bg-gray-900/90 rounded-xl p-3 border border-gray-800 text-xs space-y-1 text-gray-300">
            <p className="font-semibold text-white">Boarding Info</p>
            <p>Station: {boardingStation?.name}</p>
            <p>Platform 1 · Towards {routeInfo.terminalDirection}</p>
          </div>
        )}

        {/* Boarding Station Main Header */}
        <div className="pt-1">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {boardingStation?.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span className={`font-semibold ${lineText}`}>{routeInfo.lineName}</span>
            <span>·</span>
            <span>Towards {routeInfo.terminalDirection}</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">On time</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Platform 1 · Departed</p>
        </div>

        {/* Feature badges (Accessible, Crowded, QR Ticket) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1 flex items-center gap-1 text-[11px] text-gray-300">
            <span>♿</span>
            <span>Accessible</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1 flex items-center gap-1 text-[11px] text-gray-300">
            <span>👥</span>
            <span>Light crowd</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1 flex items-center gap-1 text-[11px] text-gray-300">
            <span>📱</span>
            <span>QR Ticket</span>
          </div>
        </div>
      </div>

      {/* --- Core Vertical Route Line & Live Tracking Timeline --- */}
      <div className="my-6 relative pl-3 pr-2">
        <div className="flex gap-4">
          {/* Vertical Color Line Container */}
          <div className="relative flex flex-col items-center py-1">
            {/* Boarding Top Circle */}
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white bg-gray-900 z-10 shadow" />

            {/* Continuous Color Track Bar */}
            <div
              className="w-2.5 flex-1 rounded-full my-1 relative overflow-hidden"
              style={{ backgroundColor: lineHex }}
            >
              {/* Shimmer / Pulse effect on line */}
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            </div>

            {/* Dynamic Live Navigation Indicator (Blue Arrow Dot) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 transition-all duration-700 ease-out z-20 flex items-center justify-center"
              style={{ top: `${progressPercent}%` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-blue-400 opacity-75" />
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-[10px] text-white transform rotate-45">▲</span>
                </div>
              </div>
            </div>

            {/* Destination Bottom Pin Node */}
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white z-10 shadow-lg flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Timeline Node Labels */}
          <div className="flex-1 flex flex-col justify-between py-0.5 space-y-5">
            {/* Boarding Station Row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-white">{boardingStation?.name}</p>
                <p className="text-[11px] text-gray-400">Boarded</p>
              </div>
              <span className="text-xs text-gray-400 font-mono">Live</span>
            </div>

            {/* Middle Expandable Intermediate Stops Card */}
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-3 my-2 shadow-sm">
              <button
                onClick={() => setShowIntermediateStops((prev) => !prev)}
                className="w-full flex items-center justify-between text-left text-xs font-medium text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  <span>
                    Ride {routeInfo.stopsCount} stops ({routeInfo.estimatedMinutes} min)
                  </span>
                </div>
                <span className="text-gray-400 text-[10px]">
                  {showIntermediateStops ? '▲ Hide' : '▼ View stops'}
                </span>
              </button>

              {/* Dropdown list of intermediate stations */}
              {showIntermediateStops && (
                <div className="mt-3 pt-2 border-t border-gray-800/80 space-y-2 max-h-48 overflow-y-auto text-xs text-gray-300">
                  {routeInfo.intermediateStops.length > 0 ? (
                    routeInfo.intermediateStops.map((stop, idx) => (
                      <div key={stop.id || idx} className="flex items-center justify-between py-1 px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                          <span>{stop.name}</span>
                        </div>
                        {stop.interchange?.length > 0 && (
                          <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">
                            🔄 {stop.interchange.join(', ')}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-[11px] italic">Direct next stop</p>
                  )}
                </div>
              )}
            </div>

            {/* Destination Station Row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-base text-white">{destinationStation?.name}</p>
                <p className="text-[11px] text-gray-400">Destination Station</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">{etaTimeString}</p>
                <p className="text-[10px] text-gray-400">Estimated ETA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Dynamic ETA & Quick Action Controls --- */}
      <div className="space-y-3 pt-2 border-t border-gray-900">
        {/* Distance Remaining & Status Banner */}
        <div className="bg-gray-900/90 rounded-2xl p-3.5 border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Distance Remaining</p>
            <p className="text-lg font-bold text-white tracking-tight">
              {journey?.distanceToDestinationMeters != null
                ? journey.distanceToDestinationMeters > 1000
                  ? `${(journey.distanceToDestinationMeters / 1000).toFixed(1)} km`
                  : `${Math.round(journey.distanceToDestinationMeters)} meters`
                : 'Calculating...'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {journey?.status === JourneyStatus.APPROACHING
                ? '⚠️ Approaching!'
                : journey?.status === JourneyStatus.ARRIVED
                ? '🚇 Arrived!'
                : 'In Transit'}
            </span>
          </div>
        </div>

        {/* Action Bar (End Button + Quick Pills + GPS Status) */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={onStop}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <span>⏹</span>
            <span>End</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Route saved to bookmarks!')}
              className="px-3 py-2 rounded-full bg-gray-900 border border-gray-800 text-gray-300 text-xs hover:bg-gray-800 transition"
            >
              🔖 Save
            </button>
            <button
              onClick={() => alert('Delay report logged. Thank you!')}
              className="px-3 py-2 rounded-full bg-gray-900 border border-gray-800 text-gray-300 text-xs hover:bg-gray-800 transition"
            >
              ⚠️ Report
            </button>
          </div>
        </div>

        <div className="flex justify-center pt-1">
          <GPSStatus accuracy={accuracy} isWatching={isWatching} demoMode={demoMode} status={geoStatus} />
        </div>
      </div>
    </div>
  );
}
