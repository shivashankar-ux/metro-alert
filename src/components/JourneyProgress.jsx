import { JourneyStatus } from '../services/journeyEngine.js';

const STATUS_COPY = {
  [JourneyStatus.ACTIVE]: { label: 'Journey in progress', color: 'text-blue-600 dark:text-blue-400' },
  [JourneyStatus.APPROACHING]: { label: "Almost there", color: 'text-amber-600 dark:text-amber-400' },
  [JourneyStatus.ARRIVED]: { label: "You're here!", color: 'text-emerald-600 dark:text-emerald-400' },
  [JourneyStatus.STOPPED]: { label: 'Journey stopped', color: 'text-gray-400' }
};

export default function JourneyProgress({ status, onStop }) {
  const copy = STATUS_COPY[status] || STATUS_COPY[JourneyStatus.ACTIVE];
  const isLive = status === JourneyStatus.ACTIVE || status === JourneyStatus.APPROACHING;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        {isLive && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current" />
          </span>
        )}
        <p className={`font-medium ${copy.color}`}>{copy.label}</p>
      </div>

      {isLive && (
        <button
          onClick={onStop}
          className="text-sm text-gray-400 dark:text-gray-500 underline underline-offset-2"
        >
          Stop Journey
        </button>
      )}
    </div>
  );
}
