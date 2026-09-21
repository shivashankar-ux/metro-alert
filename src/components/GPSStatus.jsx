import { PREFERRED_ACCURACY_METERS, MAX_ACCEPTABLE_ACCURACY_METERS } from '../services/journeyEngine.js';

export default function GPSStatus({ accuracy, isWatching, demoMode }) {
  let quality = 'unknown';
  if (accuracy != null) {
    if (accuracy <= PREFERRED_ACCURACY_METERS) quality = 'good';
    else if (accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS) quality = 'fair';
    else quality = 'poor';
  }

  const dotColor = {
    good: 'bg-emerald-500',
    fair: 'bg-amber-500',
    poor: 'bg-rose-500',
    unknown: 'bg-gray-300'
  }[quality];

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {demoMode ? (
        <span>Demo GPS</span>
      ) : (
        <span>
          {isWatching ? 'Tracking' : 'Idle'}
          {accuracy != null ? ` · ±${Math.round(accuracy)}m` : ''}
        </span>
      )}
    </div>
  );
}
