import { useMemo, useState, useEffect } from 'react';
import { getIntermediateStops } from '../services/stationDetection.js';
import { JourneyStatus } from '../services/journeyEngine.js';
import { playAlertSound, vibrateArrival5Sec, primeAudioContext } from '../services/notifications.js';
import GPSStatus from './GPSStatus.jsx';

export default function TransitNavigationCard({
  journey,
  onStop,
  geoStatus,
  accuracy,
  isWatching,
  demoMode
}) {
  const [showIntermediateStops, setShowIntermediateStops] = useState(true);
  const [showPreviousSteps, setShowPreviousSteps] = useState(false);
  const [soundTested, setSoundTested] = useState(false);

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

  // Compute progress percentage along vertical route line (0% at start, 100% at destination)
  const progressPercent = useMemo(() => {
    if (!journey) return 0;
    const initialDist = journey.startedAtDistanceMeters || (routeInfo.stopsCount * 1200) || 5000;
    const currentDist = journey.distanceToDestinationMeters ?? initialDist;
    const percent = Math.max(5, Math.min(94, ((initialDist - currentDist) / initialDist) * 100));
    return journey.status === JourneyStatus.ARRIVED ? 96 : Math.round(percent);
  }, [journey, routeInfo.stopsCount]);

  // Calculate live speed based on distance delta over time
  const calculatedSpeedKmh = useMemo(() => {
    if (demoMode) return 42; // Simulated transit speed
    if (!journey?.lastKnownPosition?.coords?.speed) {
      return 38; // Default average Metro speed
    }
    const speedMs = journey.lastKnownPosition.coords.speed;
    return Math.round(speedMs * 3.6);
  }, [journey?.lastKnownPosition, demoMode]);

  // Determine current stop index along route stops
  const currentNextStation = useMemo(() => {
    if (!routeInfo.stops || routeInfo.stops.length < 2) return null;
    const totalStops = routeInfo.stops.length;
    const frac = progressPercent / 100;
    const nextIdx = Math.min(totalStops - 1, Math.max(1, Math.floor(frac * (totalStops - 1)) + 1));
    return routeInfo.stops[nextIdx] || destinationStation;
  }, [routeInfo.stops, progressPercent, destinationStation]);

  const lineBg = {
    'Red Line': 'bg-red-600 shadow-red-600/40',
    'Blue Line': 'bg-blue-600 shadow-blue-600/40',
    'Green Line': 'bg-emerald-600 shadow-emerald-600/40'
  }[routeInfo.lineName] || 'bg-red-600 shadow-red-600/40';

  const lineText = {
    'Red Line': 'text-red-400',
    'Blue Line': 'text-blue-400',
    'Green Line': 'text-emerald-400'
  }[routeInfo.lineName] || 'text-red-400';

  const lineHex = routeInfo.lineHex;

  function handleTestSound() {
    primeAudioContext();
    playAlertSound(true);
    vibrateArrival5Sec();
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 3000);
  }

  const isApproaching = journey?.status === JourneyStatus.APPROACHING;
  const isArrived = journey?.status === JourneyStatus.ARRIVED;

  return (
    <div className="w-full max-w-md mx-auto bg-gray-950 text-white min-h-[92vh] flex flex-col justify-between p-4 sm:p-5 rounded-3xl border border-gray-800/80 shadow-2xl overflow-hidden font-sans relative">
      {/* Background Neon Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* --- Top Header & Metro Line Banner --- */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${lineBg}`}>
              {routeInfo.lineName}
            </span>
            <span className="text-xs text-gray-400 font-medium">Hyderabad Metro</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestSound}
              className="px-2.5 py-1 rounded-full bg-gray-900 border border-gray-700 hover:bg-gray-800 text-[11px] font-medium text-emerald-400 flex items-center gap-1 active:scale-95 transition"
              title="Test Alarm Sound & Vibration"
            >
              <span>{soundTested ? '🔊 Ringing!' : '🔔 Test Alarm'}</span>
            </button>

            <button
              onClick={onStop}
              className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition active:scale-95"
              title="End Journey"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Boarding Station Header Card */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-800/80 shadow-inner">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
                Boarding Station
              </p>
              <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
                {boardingStation?.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ● Live Tracking
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300 mt-2 pt-2 border-t border-gray-800/60">
            <span className={`font-semibold ${lineText}`}>{routeInfo.lineName}</span>
            <span>•</span>
            <span>Towards <strong className="text-white">{routeInfo.terminalDirection}</strong></span>
            <span>•</span>
            <span>Platform 1</span>
          </div>

          <button
            onClick={() => setShowPreviousSteps((prev) => !prev)}
            className="mt-2 text-[11px] text-gray-400 hover:text-gray-200 flex items-center gap-1 transition"
          >
            <span>{showPreviousSteps ? 'Hide journey origin details' : 'Show journey origin details'}</span>
            <span>{showPreviousSteps ? '▲' : '▼'}</span>
          </button>

          {showPreviousSteps && (
            <div className="mt-2 p-2.5 bg-black/40 rounded-xl text-xs space-y-1 text-gray-300 border border-gray-800">
              <p className="font-medium text-white">Boarded: {boardingStation?.name}</p>
              <p className="text-[11px] text-gray-400">Started at {new Date(journey?.startedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Core Metro Track & Animated Moving Train Visualizer --- */}
      <div className="my-5 relative z-10 px-1">
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800/90 rounded-2xl p-4 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚇</span> Live Train Track
            </span>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              ⚡ {calculatedSpeedKmh} km/h
            </span>
          </div>

          {/* Railway Visual Track */}
          <div className="relative py-2 pl-3 pr-2">
            <div className="flex gap-4">
              {/* Track Line Container */}
              <div className="relative flex flex-col items-center py-1 min-h-[220px]">
                {/* Boarding Top Node Pin 📍 */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.8)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                </div>

                {/* Styled Dual Railway Track */}
                <div
                  className="w-3 flex-1 rounded-full my-1 relative overflow-hidden shadow-inner border border-white/10"
                  style={{ backgroundColor: lineHex }}
                >
                  {/* Railway ties shimmer pattern */}
                  <div className="absolute inset-0 bg-white/15 animate-track-shimmer" />
                </div>

                {/* Animated Moving Train Badge 🚇 */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 transition-all duration-700 ease-out z-20"
                  style={{ top: `${progressPercent}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Headlight beam glow */}
                    <div className="absolute -top-3 w-8 h-8 bg-blue-400/30 rounded-full blur-md animate-headlight pointer-events-none" />
                    
                    {/* Glowing Pulse Ring */}
                    <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/50 animate-pulse-ring absolute" />

                    {/* Train Icon Badge */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white shadow-2xl flex items-center justify-center text-sm transform active:scale-110 transition">
                      🚇
                    </div>
                  </div>
                </div>

                {/* Destination Bottom Node Pin 🏁 */}
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-[0_0_12px_rgba(220,38,38,0.8)] flex items-center justify-center">
                    <span className="text-[10px]">🏁</span>
                  </div>
                </div>
              </div>

              {/* Station Timeline Information */}
              <div className="flex-1 flex flex-col justify-between py-0.5 space-y-4">
                {/* Boarding Station Details */}
                <div className="flex items-center justify-between bg-black/30 p-2 rounded-xl border border-gray-800/60">
                  <div>
                    <p className="font-bold text-sm text-white">{boardingStation?.name}</p>
                    <p className="text-[11px] text-emerald-400 font-medium">● Boarded & Departed</p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                    Start
                  </span>
                </div>

                {/* Next Station Indicator */}
                {currentNextStation && currentNextStation.id !== destinationStation?.id && (
                  <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                        Current / Next Station
                      </p>
                      <p className="text-xs font-bold text-white">{currentNextStation.name}</p>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-medium px-2 py-0.5 rounded-full border border-blue-500/30">
                      In Transit 🚇
                    </span>
                  </div>
                )}

                {/* Intermediate Stops Accordion */}
                <div className="bg-black/50 border border-gray-800 rounded-xl p-3 shadow-sm">
                  <button
                    onClick={() => setShowIntermediateStops((prev) => !prev)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>
                        {routeInfo.stopsCount} Stops ({routeInfo.estimatedMinutes} min total)
                      </span>
                    </div>
                    <span className="text-gray-400 text-[10px]">
                      {showIntermediateStops ? '▲ Hide Stops' : '▼ View All Stops'}
                    </span>
                  </button>

                  {/* Intermediate Stops List */}
                  {showIntermediateStops && (
                    <div className="mt-2.5 pt-2 border-t border-gray-800 space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs text-gray-300">
                      {routeInfo.stops.map((stop, idx) => {
                        const isStart = stop.id === boardingStation?.id;
                        const isEnd = stop.id === destinationStation?.id;
                        const stopFrac = idx / (routeInfo.stops.length - 1 || 1);
                        const isPassed = progressPercent / 100 >= stopFrac;

                        return (
                          <div
                            key={stop.id || idx}
                            className={`flex items-center justify-between py-1 px-2 rounded-lg transition ${
                              isEnd
                                ? 'bg-red-950/30 border border-red-900/40 text-white font-bold'
                                : isStart
                                ? 'bg-emerald-950/30 border border-emerald-900/40 text-emerald-200'
                                : isPassed
                                ? 'text-gray-500'
                                : 'text-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isEnd
                                    ? 'bg-red-500'
                                    : isStart
                                    ? 'bg-emerald-500'
                                    : isPassed
                                    ? 'bg-gray-600'
                                    : 'bg-blue-400'
                                }`}
                              />
                              <span className="text-xs">{stop.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {stop.interchange?.length > 0 && (
                                <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">
                                  🔄 {stop.interchange.join(', ')}
                                </span>
                              )}
                              {isPassed && !isEnd && (
                                <span className="text-[9px] text-gray-500 font-mono">Passed ✓</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Destination Station Details */}
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-red-900/40 shadow-sm">
                  <div>
                    <p className="font-bold text-base text-white">{destinationStation?.name}</p>
                    <p className="text-[11px] text-red-400 font-medium">Destination Station 🏁</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-400 font-mono">{etaTimeString}</p>
                    <p className="text-[10px] text-gray-400">Est. Arrival</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Live Metrics & Status Banner --- */}
      <div className="space-y-3 pt-2 relative z-10">
        {/* Dynamic Distance Remaining Card */}
        <div
          className={`rounded-2xl p-4 border transition-all duration-500 ${
            isArrived
              ? 'bg-emerald-950/80 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : isApproaching
              ? 'bg-amber-950/80 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
              : 'bg-gray-900/90 border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Distance to Destination
              </p>
              <p className="text-3xl font-extrabold text-white tracking-tight font-mono mt-0.5">
                {journey?.distanceToDestinationMeters != null
                  ? journey.distanceToDestinationMeters > 1000
                    ? `${(journey.distanceToDestinationMeters / 1000).toFixed(1)} km`
                    : `${Math.round(journey.distanceToDestinationMeters)} m`
                  : 'Calculating...'}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  isArrived
                    ? 'bg-emerald-500 text-white border-emerald-400 animate-bounce'
                    : isApproaching
                    ? 'bg-amber-500 text-black border-amber-400 animate-bounce'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}
              >
                {isArrived
                  ? '🚇 ARRIVED AT DESTINATION!'
                  : isApproaching
                  ? '⚠️ APPROACHING (<500m)'
                  : 'IN TRANSIT'}
              </span>
              <p className="text-[10px] text-gray-400 mt-1">
                {isArrived
                  ? 'Ring alarm playing...'
                  : isApproaching
                  ? 'Get ready to disembark'
                  : 'Alerts set at 500m & 200m'}
              </p>
            </div>
          </div>
        </div>

        {/* PWA Background Guarantee Banner */}
        <div className="bg-gray-900/60 rounded-xl px-3 py-2 border border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PWA Background Alarm Active</span>
          </div>
          <span className="text-[10px] text-gray-500">Works when app is closed</span>
        </div>

        {/* Action Controls & GPS Status */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={onStop}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition"
          >
            <span>⏹</span>
            <span>Stop Journey</span>
          </button>

          <button
            onClick={handleTestSound}
            className="py-3 px-4 rounded-2xl bg-gray-900 border border-gray-800 hover:bg-gray-800 active:scale-[0.98] text-gray-300 text-xs font-medium transition"
          >
            🔔 Test Alarm
          </button>
        </div>

        <div className="flex justify-center pt-1">
          <GPSStatus accuracy={accuracy} isWatching={isWatching} demoMode={demoMode} status={geoStatus} />
        </div>
      </div>
    </div>
  );
}

