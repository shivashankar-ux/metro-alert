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
        <div className="max-w-md mx-auto px-4 sm:px-5 py-6 space-y-5">
          {/* Header Banner */}
          <header className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Hyderabad Metro Alert PWA
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Where are you traveling today?
            </h1>
            <p className="text-xs text-gray-400">
              Auto-detects your station & alerts you before your destination, even when your phone is locked.
            </p>
          </header>

          {/* Current / Boarding Station Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                📍 Boarding Station
              </span>
              <button
                onClick={() => setPickingBoardingManually((prev) => !prev)}
                className="text-xs text-blue-400 hover:underline"
              >
                {pickingBoardingManually ? 'Use GPS detection' : 'Change station'}
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
              <div className="space-y-2 pt-1">
                <p className="text-xs text-gray-400">Search and tap your boarding station:</p>
                <StationSearch
                  query={stations.query}
                  setQuery={stations.setQuery}
                  results={stations.results}
                  boardingStationId={null}
                  autoFocus
                  onSelect={(s) => {
                    setManualBoardingId(s.id);
                    setPickingBoardingManually(false);
                    stations.setQuery('');
                  }}
                />
              </div>
            )}
          </div>

          {/* Destination Station Search */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              🏁 Destination Station
            </span>

            <StationSearch
              query={stations.query}
              setQuery={stations.setQuery}
              results={stations.results}
              boardingStationId={boardingStation?.id}
              onSelect={(s) => {
                setSelectedDestinationId(s.id);
                stations.setQuery('');
              }}
            />
          </div>

          {/* Selected Destination Preview Card */}
          {destinationStation && (
            <div className="rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-800/80 p-4 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                  Destination Ready
                </span>
                <p className="text-lg font-extrabold text-white mt-1">{destinationStation.name}</p>
                <p className="text-xs text-gray-300">
                  {destinationStation.line} • {destinationStation.interchange?.length > 0 ? `Interchange: ${destinationStation.interchange.join(', ')}` : 'Direct Line'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDestinationId(null)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-black/40 rounded-lg border border-gray-800"
              >
                Change
              </button>
            </div>
          )}

          {/* Notification Permission Card */}
          <NotificationPermission
            permission={notificationPermission}
            onRequest={async () => setNotificationPermission(await requestNotificationPermission())}
          />

          {/* Start Journey Button */}
          <button
            disabled={!boardingStation || !destinationStation}
            onClick={handleStartJourney}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold text-base active:scale-[0.98] transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <span>🚇</span>
            <span>Start Metro Journey</span>
          </button>

          {/* Background Alarm Instructions */}
          <div className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-1 text-xs text-gray-400">
            <p className="font-semibold text-gray-200 flex items-center gap-1.5">
              <span>📱</span> PWA Background Support
            </p>
            <p>Once you start your journey, you can minimize the app or lock your screen. The PWA keeps GPS active & rings alarm audio + 5-sec vibration on arrival.</p>
          </div>

          <div className="flex justify-center">
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="px-5 py-4 text-center">
        <button
          onClick={onOpenDemo}
          className="text-[11px] text-gray-300 dark:text-gray-700 underline underline-offset-2"
        >
          {demoMode ? 'Demo mode active — open panel' : 'Demo Mode'}
        </button>
      </footer>
    </div>
  );
}
