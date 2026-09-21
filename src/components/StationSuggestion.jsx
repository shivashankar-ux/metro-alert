const LINE_COLORS = {
  'Red Line': 'bg-line-red',
  'Blue Line': 'bg-line-blue',
  'Green Line': 'bg-line-green'
};

export default function StationSuggestion({ station, onSelect }) {
  return (
    <button
      onClick={() => onSelect(station)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800 transition rounded-xl"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${LINE_COLORS[station.line] || 'bg-gray-400'}`} />
      <span className="flex-1 min-w-0">
        <span className="block font-medium truncate">{station.name}</span>
        <span className="block text-xs text-gray-400 dark:text-gray-500">{station.line}</span>
      </span>
      {station.interchange?.length > 0 && (
        <span className="text-[10px] uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
          Interchange
        </span>
      )}
    </button>
  );
}
