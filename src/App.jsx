import { useEffect, useMemo, useState } from 'react';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useStations } from './hooks/useStations.js';
import { useJourney } from './hooks/useJourney.js';
import { detectBoardingStation, getStationById } from './services/stationDetection.js';
import {
  getNotificationPermission,
  requestNotificationPermission,
  primeAudioContext,
  requestScreenWakeLock,
  releaseScreenWakeLock
} from './services/notifications.js';
import { JourneyStatus } from './services/journeyEngine.js';

import LocationPermission from './components/LocationPermission.jsx';
import CurrentStation from './components/CurrentStation.jsx';
import StationSearch from './components/StationSearch.jsx';
import JourneyCard from './components/JourneyCard.jsx';
import TransitNavigationCard from './components/TransitNavigationCard.jsx';
import JourneyProgress from './components/JourneyProgress.jsx';
import DistanceDisplay from './components/DistanceDisplay.jsx';
import ArrivalAlert from './components/ArrivalAlert.jsx';
import NotificationPermission from './components/NotificationPermission.jsx';
import GPSStatus from './components/GPSStatus.jsx';
import DemoModePanel from './components/DemoModePanel.jsx';
import ScreenFlasher from './components/ScreenFlasher.jsx';

export default function App() {
  const [locationRequested, setLocationRequested] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoPanelOpen, setDemoPanelOpen] = useState(false);
  const [demoPosition, setDemoPosition] = useState(null);
  const [manualBoardingId, setManualBoardingId] = useState(null);
  const [pickingBoardingManually, setPickingBoardingManually] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
  const [flasherMode, setFlasherMode] = useState(null);

  const geo = useGeolocation({ demoPosition: demoMode ? demoPosition : null });
  const stations = useStations();
  const journey = useJourney();

  // Auto-resume GPS watching and Wake Lock when an active journey exists (e.g. restored from localStorage)
  useEffect(() => {
    if (journey.isActive && !demoMode) {
      if (!geo.isWatching) {
        geo.startWatching();
      }
      requestScreenWakeLock();
    }
  }, [journey.isActive, demoMode, geo]);

  // Re-acquire Wake Lock, resume AudioContext, and pull fresh GPS coordinates when returning from background
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        primeAudioContext();
        if (journey.isActive && !demoMode) {
          requestScreenWakeLock();
          geo.requestOnce({ maximumAge: 0, timeout: 10000 });
          if (!geo.isWatching) {
            geo.startWatching();
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [journey.isActive, demoMode, geo]);

  // Trigger 3-second screen flash when status changes to APPROACHING or ARRIVED
  useEffect(() => {
    const status = journey.journey?.status;
    if (status === JourneyStatus.APPROACHING) {
      setFlasherMode('approaching');
    } else if (status === JourneyStatus.ARRIVED) {
      setFlasherMode('arrival');
    }
  }, [journey.journey?.status]);

  // ---- Boarding station: auto-detected, or manual fallback -------------
  const detection = useMemo(() => {
    if (!geo.position) return null;
    return detectBoardingStation(geo.position.coords.latitude, geo.position.coords.longitude);
  }, [geo.position]);

  const manualBoardingStation = manualBoardingId ? getStationById(manualBoardingId) : null;
  const boardingStation = manualBoardingStation || detection?.station || null;
  const boardingDistance = manualBoardingStation ? null : detection?.distanceMeters ?? null;

  const destinationStation = selectedDestinationId ? getStationById(selectedDestinationId) : null;

  // ---- Feed live/demo position into the active journey ------------------
  useEffect(() => {
    if (journey.isActive && geo.position) {
      journey.reportPosition(geo.position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.position, journey.isActive]);

  // ---- Handlers -----------------------------------------------------
  async function handleAllowLocation() {
    setLocationRequested(true);
    await geo.requestOnce();
  }

  async function handleStartJourney() {
    if (!boardingStation || !destinationStation) return;
    primeAudioContext();
    requestScreenWakeLock();
    if (notificationPermission === 'default') {
      const result = await requestNotificationPermission();
      setNotificationPermission(result);
    }
    journey.start(boardingStation, destinationStation);
    if (!demoMode) geo.startWatching();
  }

  function handleStopJourney() {
    journey.stop();
    geo.stopWatching();
    releaseScreenWakeLock();
  }

  function handleStartNewJourney() {
    journey.reset();
    geo.stopWatching();
    releaseScreenWakeLock();
    setSelectedDestinationId(null);
    stations.setQuery('');
  }

  function handleOpenDemo() {
    setDemoMode(true);
    setDemoPanelOpen(true);
    primeAudioContext();
    requestScreenWakeLock();
  }

  function handleSimulatedPosition(position, demoStart, demoEnd) {
    setDemoPosition(position);
    if (demoStart && demoEnd) {
      if (!journey.isActive || journey.journey?.boardingStation?.id !== demoStart.id || journey.journey?.destinationStation?.id !== demoEnd.id) {
        journey.start(demoStart, demoEnd);
      }
    }
    if (position) {
      journey.reportPosition(position);
    }
  }

  function handleExitDemo() {
    setDemoMode(false);
    setDemoPanelOpen(false);
    setDemoPosition(null);
    journey.reset();
  }

  // ---- Render -----------------------------------------------------
  if (!geo.supported) {
    return <ErrorScreen kind="unsupported" />;
  }

  if (!locationRequested && !demoMode && !journey.isActive) {
    return (
      <Shell onOpenDemo={handleOpenDemo}>
        <LocationPermission status={geo.status} onAllow={handleAllowLocation} />
        {demoPanelOpen && (
          <DemoModePanel
            onClose={() => setDemoPanelOpen(false)}
            onSimulatedPosition={handleSimulatedPosition}
            onExitDemo={handleExitDemo}
          />
        )}
      </Shell>
    );
  }

  if (!demoMode && !journey.isActive && (geo.status === 'denied' || geo.status === 'unavailable' || geo.status === 'timeout')) {
    const kindMap = { denied: 'location-denied', unavailable: 'location-unavailable', timeout: 'location-timeout' };
    return (
      <Shell onOpenDemo={handleOpenDemo}>
        <ErrorScreen kind={kindMap[geo.status]} onRetry={handleAllowLocation} />
        {demoPanelOpen && (
          <DemoModePanel
            onClose={() => setDemoPanelOpen(false)}
            onSimulatedPosition={handleSimulatedPosition}
            onExitDemo={handleExitDemo}
          />
        )}
      </Shell>
    );
  }

  const inJourney = journey.isActive;
  const arrived = journey.journey?.status === JourneyStatus.ARRIVED;

  return (
    <Shell onOpenDemo={handleOpenDemo} demoMode={demoMode}>
      {!inJourney && (
        <div className="max-w-md mx-auto px-4 pt-safe pb-6 space-y-4">

          {/* ── Top header ── */}
          <header className="anim-slide-up pt-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                Hyderabad Metro
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
              Plan your journey
            </h1>
          </header>

          {/* ── Route builder card ── */}
          <div className="anim-slide-up anim-delay-1 card p-4 space-y-3">

            {/* Boarding row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">From</span>
                <button
                  onClick={() => setPickingBoardingManually((prev) => !prev)}
                  className="text-[11px] font-semibold text-indigo-400"
                >
                  {pickingBoardingManually ? '← Use GPS' : 'Change'}
                </button>
              </div>
              <CurrentStation
                station={boardingStation}
                distanceMeters={boardingDistance}
                loading={geo.status === 'requesting' && !geo.position}
                notFound={!boardingStation && geo.position != null}
                onManualSelect={() => setPickingBoardingManually(true)}
              />
              {pickingBoardingManually && (
                <div className="pt-1">
                  <StationSearch
                    query={stations.query}
                    setQuery={stations.setQuery}
                    results={stations.results}
                    boardingStationId={null}
                    autoFocus
                    placeholder="Search boarding station…"
                    onSelect={(s) => {
                      setManualBoardingId(s.id);
                      setPickingBoardingManually(false);
                      stations.setQuery('');
                    }}
                  />
                </div>
              )}
            </div>

            {/* Divider with arrow */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/8 flex items-center justify-center text-sm">↕</div>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Destination row */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">To</span>
              {destinationStation ? (
                <div className="card flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🏁</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Destination set</p>
                    <p className="text-base font-bold text-white truncate mt-0.5">{destinationStation.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{destinationStation.line}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDestinationId(null)}
                    className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <StationSearch
                  query={stations.query}
                  setQuery={stations.setQuery}
                  results={stations.results}
                  boardingStationId={boardingStation?.id}
                  placeholder="Where are you going?"
                  onSelect={(s) => {
                    setSelectedDestinationId(s.id);
                    stations.setQuery('');
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Notification ── */}
          <div className="anim-slide-up anim-delay-2">
            <NotificationPermission
              permission={notificationPermission}
              onRequest={async () => setNotificationPermission(await requestNotificationPermission())}
            />
          </div>

          {/* ── Start button ── */}
          <div className="anim-slide-up anim-delay-3">
            <button
              disabled={!boardingStation || !destinationStation}
              onClick={handleStartJourney}
              className="btn-primary"
            >
              <span>🚇</span>
              <span>Start Journey</span>
            </button>
          </div>

          {/* ── Info strip ── */}
          <div className="anim-slide-up anim-delay-4 card px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm">📱</div>
            <p className="text-xs text-zinc-500 leading-snug">
              Lock your screen after starting — alarm still fires at 500 m and 200 m from destination.
            </p>
          </div>

          {/* ── GPS status ── */}
          <div className="flex justify-center pb-1">
            <GPSStatus accuracy={geo.position?.coords?.accuracy} isWatching={geo.isWatching} demoMode={demoMode} status={geo.status} />
          </div>
        </div>
      )}

      {inJourney && journey.journey && (
        <div className="py-2">
          <TransitNavigationCard
            journey={journey.journey}
            onStop={handleStopJourney}
            geoStatus={geo.status}
            accuracy={geo.position?.coords?.accuracy}
            isWatching={geo.isWatching}
            demoMode={demoMode}
          />
        </div>
      )}

      {arrived && journey.journey && (
        <ArrivalAlert
          destinationStation={journey.journey.destinationStation}
          onStartNew={handleStartNewJourney}
        />
      )}

      {flasherMode && (
        <ScreenFlasher mode={flasherMode} onComplete={() => setFlasherMode(null)} />
      )}

      {demoPanelOpen && (
        <DemoModePanel
          onClose={() => setDemoPanelOpen(false)}
          onSimulatedPosition={handleSimulatedPosition}
          onExitDemo={handleExitDemo}
        />
      )}
    </Shell>
  );
}

function Shell({ children, onOpenDemo, demoMode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-[#09090b]">
      <div className="flex-1">{children}</div>

      <footer className="pb-safe px-5 py-2 text-center">
        <button
          onClick={onOpenDemo}
          className={`text-[11px] font-medium transition ${
            demoMode ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-500'
          }`}
        >
          {demoMode ? '🧪 Demo active' : 'Demo Mode'}
        </button>
      </footer>
    </div>
  );
}
