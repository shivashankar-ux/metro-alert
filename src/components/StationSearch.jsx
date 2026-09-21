import StationSuggestion from './StationSuggestion.jsx';

export default function StationSearch({ query, setQuery, results, boardingStationId, onSelect, autoFocus }) {
  const filteredResults = results.filter((s) => s.id !== boardingStationId);

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          inputMode="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search destination station"
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {query.trim().length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              No stations match "{query}"
            </p>
          ) : (
            filteredResults.map((station) => (
              <StationSuggestion key={station.id} station={station} onSelect={onSelect} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
