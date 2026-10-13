import { PREFERRED_ACCURACY_METERS, MAX_ACCEPTABLE_ACCURACY_METERS } from '../services/journeyEngine.js';

export default function GPSStatus({ accuracy, isWatching, demoMode, status }) {
  let quality = 'unknown';
  if (accuracy != null) {
    if (accuracy <= PREFERRED_ACCURACY_METERS)       quality = 'good';
    else if (accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS) quality = 'fair';
    else quality = 'poor';
  }
  if (isWatching && (status === 'timeout' || status === 'unavailable' || status === 'requesting')) {
    quality = 'seeking';
  }

  const config = {
    good:    { dot: 'bg-emerald-500', text: 'text-emerald-500', label: 'GPS Good' },
    fair:    { dot: 'bg-amber-400',   text: 'text-amber-400',   label: 'GPS Fair' },
    poor:    { dot: 'bg-rose-500',    text: 'text-rose-500',    label: 'GPS Poor' },
    seeking: { dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400', label: 'Acquiring GPS…' },
    unknown: { dot: 'bg-zinc-600',   text: 'text-zinc-500',    label: isWatching ? 'Tracking' : 'GPS Idle' },
  }[quality];

  let label = config.label;
  if (!isWatching && quality !== 'seeking') label = 'GPS Idle';
  if (status === 'requesting' && isWatching) label = 'Acquiring GPS…';
  if ((status === 'timeout' || status === 'unavailable') && isWatching) label = 'Reconnecting…';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[11px] font-medium ${config.text}`}>
        {demoMode ? 'Demo GPS' : `${label}${accuracy != null ? ` · ±${Math.round(accuracy)}m` : ''}`}
      </span>
    </div>
  );
}
