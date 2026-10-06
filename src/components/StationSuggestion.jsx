const LINE_BADGE_STYLE = {
  'Red Line': 'bg-red-600 text-white',
  'Blue Line': 'bg-blue-600 text-white',
  'Green Line': 'bg-emerald-600 text-white'
};

export default function StationSuggestion({ station, onSelect }) {
  const badgeClass = LINE_BADGE_STYLE[station.line] || 'bg-gray-700 text-white';

  return (
    <button
      onClick={() => onSelect(station)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/80 active:bg-gray-100 dark:active:bg-gray-800 transition rounded-xl"
    >
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${badgeClass}`}>
        {station.line}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold truncate text-gray-900 dark:text-gray-100">{station.name}</span>
      </span>
      {station.interchange?.length > 0 && (
        <span className="text-[10px] tracking-wide bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
          🔄 Interchange
        </span>
      )}
    </button>
  );
}

