import { useEffect, useMemo, useState } from 'react';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useStations } from './hooks/useStations.js';
import { useJourney } from './hooks/useJourney.js';
import { detectBoardingStation, getStationById } from './services/stationDetection.js';
import {
  getNotificationPermission,
  requestNotificationPermission
} from './services/notifications.js';
import { JourneyStatus } from './services/journeyEngine.js';

import LocationPermission from './components/LocationPermission.jsx';
import CurrentStation from './components/CurrentStation.jsx';
import StationSearch from './components/StationSearch.jsx';
import JourneyCard from './components/JourneyCard.jsx';
import JourneyProgress from './components/JourneyProgress.jsx';
import DistanceDisplay from './components/DistanceDisplay.jsx';
import ArrivalAlert from './components/ArrivalAlert.jsx';
import NotificationPermission from './components/NotificationPermission.jsx';
import GPSStatus from './components/GPSStatus.jsx';
import DemoModePanel from './components/DemoModePanel.jsx';
import ErrorScreen from './components/ErrorScreen.jsx';

export default function App() {
  const [locationRequested, setLocationRequested] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoPanelOpen, setDemoPanelOpen] = useState(false);
  const [demoPosition, setDemoPosition] = useState(null);
  const [manualBoardingId, setManualBoardingId] = useState(null);
  const [pickingBoardingManually, setPickingBoardingManually] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());

  const geo = useGeolocation({ demoPosition: demoMode ? demoPosition : null });
  const stations = useStations();
  const journey = useJourney();

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
  }

  function handleStartNewJourney() {
    journey.reset();
    geo.stopWatching();
    setSelectedDestinationId(null);
    stations.setQuery('');
  }

  function handleOpenDemo() {
    setDemoMode(true);
    setDemoPanelOpen(true);
  }

  function handleSimulatedPosition(position) {
    setDemoPosition(position);
  }

  function handleExitDemo() {
    setDemoMode(false);
    setDemoPanelOpen(false);
    setDemoPosition(null);
  }

  // ---- Render -----------------------------------------------------
  if (!geo.supported) {
    return <ErrorScreen kind="unsupported" />;
  }

  if (!locationRequested && !demoMode) {
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

  if (!demoMode && (geo.status === 'denied' || geo.status === 'unavailable' || geo.status === 'timeout')) {
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
        <div className="max-w-md mx-auto px-5 py-6 space-y-5">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold">Where are you going?</h1>
          </header>

          <CurrentStation
            station={boardingStation}
            distanceMeters={boardingDistance}
            loading={geo.status === 'requesting' && !geo.position}
            notFound={!boardingStation && geo.position != null}
            onManualSelect={() => setPickingBoardingManually(true)}
          />

          {pickingBoardingManually && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Select boarding station manually
              </p>
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

          {destinationStation && (
            <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-500 dark:text-blue-400">Destination</p>
                <p className="font-semibold text-blue-800 dark:text-blue-200">{destinationStation.name}</p>
              </div>
              <button
                onClick={() => setSelectedDestinationId(null)}
                className="text-xs text-blue-500 dark:text-blue-400 underline"
              >
                Change
              </button>
            </div>
          )}

          <NotificationPermission
            permission={notificationPermission}
            onRequest={async () => setNotificationPermission(await requestNotificationPermission())}
          />

          <button
            disabled={!boardingStation || !destinationStation}
            onClick={handleStartJourney}
            className="w-full py-3.5 rounded-2xl bg-blue-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-medium text-base active:scale-[0.98] transition"
          >
            Start Journey
          </button>

          <div className="flex justify-center">
            <GPSStatus accuracy={geo.position?.coords?.accuracy} isWatching={geo.isWatching} demoMode={demoMode} />
          </div>
        </div>
      )}

      {inJourney && journey.journey && (
        <div className="max-w-md mx-auto px-5 py-6 space-y-6">
          <JourneyCard
            boardingStation={journey.journey.boardingStation}
            destinationStation={journey.journey.destinationStation}
          />

          {journey.journey.status === JourneyStatus.APPROACHING && (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-center">
              <p className="font-medium text-amber-700 dark:text-amber-300">
                You're approaching {journey.journey.destinationStation.name}.
              </p>
            </div>
          )}

          <DistanceDisplay distanceMeters={journey.journey.distanceToDestinationMeters} />

          <JourneyProgress status={journey.journey.status} onStop={handleStopJourney} />

          <div className="flex justify-center">
            <GPSStatus accuracy={geo.position?.coords?.accuracy} isWatching={geo.isWatching} demoMode={demoMode} />
          </div>
        </div>
      )}

      {arrived && journey.journey && (
        <ArrivalAlert
          destinationStation={journey.journey.destinationStation}
          onStartNew={handleStartNewJourney}
        />
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
