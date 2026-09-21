import { formatDistance } from '../services/distance.js';

const LINE_COLORS = {
  'Red Line': 'bg-line-red',
  'Blue Line': 'bg-line-blue',
  'Green Line': 'bg-line-green'
};

export default function CurrentStation({ station, distanceMeters, loading, notFound, onManualSelect }) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3 animate-pulse-slow">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          We couldn't confidently detect your metro station.
        </p>
        <button
          onClick={onManualSelect}
          className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200 underline underline-offset-2"
        >
          Select it manually
        </button>
      </div>
    );
  }

  if (!station) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
      <div className={`w-2.5 h-10 rounded-full ${LINE_COLORS[station.line] || 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          You're near
        </p>
        <p className="text-lg font-semibold truncate">{station.name}</p>
      </div>
      {distanceMeters != null && (
        <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {formatDistance(distanceMeters)}
        </span>
      )}
    </div>
  );
}
