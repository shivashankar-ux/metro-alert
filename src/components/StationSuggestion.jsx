const LINE_DOT = {
  'Red Line':   'bg-red-500',
  'Blue Line':  'bg-blue-500',
  'Green Line': 'bg-emerald-500',
};

export default function StationSuggestion({ station, onSelect }) {
  const dot = LINE_DOT[station.line] || 'bg-zinc-500';

  return (
    <button
      onClick={() => onSelect(station)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left card-pressed active:bg-zinc-900 transition"
    >
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-white truncate">{station.name}</span>
        <span className="block text-xs text-zinc-500 mt-0.5">{station.line}</span>
      </span>
      {station.interchange?.length > 0 && (
        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
          interchange
        </span>
      )}
    </button>
  );
}
