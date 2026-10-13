import { formatDistance } from '../services/distance.js';

const LINE_DOT = {
  'Red Line':   'bg-red-500',
  'Blue Line':  'bg-blue-500',
  'Green Line': 'bg-emerald-500',
};
const LINE_TEXT = {
  'Red Line':   'text-red-400',
  'Blue Line':  'text-blue-400',
  'Green Line': 'text-emerald-400',
};
const LINE_BG = {
  'Red Line':   'bg-red-500/10 border-red-500/20',
  'Blue Line':  'bg-blue-500/10 border-blue-500/20',
  'Green Line': 'bg-emerald-500/10 border-emerald-500/20',
};

export default function CurrentStation({ station, distanceMeters, loading, notFound, onManualSelect }) {
  if (loading) {
    return (
      <div className="card px-4 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-20 skeleton rounded-full" />
          <div className="h-4 w-36 skeleton rounded-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card border-amber-500/20 bg-amber-500/5 px-4 py-3.5 flex items-start gap-3">
        <span className="text-amber-400 text-lg mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-300">Station not detected</p>
          <p className="text-xs text-zinc-500 mt-0.5">You may be outside metro range.</p>
          <button
            onClick={onManualSelect}
            className="mt-2 text-xs font-semibold text-indigo-400 underline underline-offset-2"
          >
            Select manually →
          </button>
        </div>
      </div>
    );
  }

  if (!station) return null;

  const lineDot  = LINE_DOT[station.line]  || 'bg-zinc-500';
  const lineText = LINE_TEXT[station.line] || 'text-zinc-400';
  const lineBg   = LINE_BG[station.line]   || 'bg-zinc-800/30 border-zinc-700/30';

  return (
    <div className="card px-4 py-4 flex items-center gap-3.5">
      {/* Line color dot */}
      <div className={`w-10 h-10 rounded-xl ${lineBg} border flex items-center justify-center flex-shrink-0`}>
        <span className={`w-3 h-3 rounded-full ${lineDot}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nearest Station</p>
        <p className="text-base font-bold text-white truncate mt-0.5">{station.name}</p>
        <p className={`text-xs font-medium mt-0.5 ${lineText}`}>{station.line}</p>
      </div>
      {distanceMeters != null && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-white">{formatDistance(distanceMeters)}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">away</p>
        </div>
      )}
    </div>
  );
}
