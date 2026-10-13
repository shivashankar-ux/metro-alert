import StationSuggestion from './StationSuggestion.jsx';

export default function StationSearch({ query, setQuery, results, boardingStationId, onSelect, autoFocus, placeholder }) {
  const filteredResults = results.filter((s) => s.id !== boardingStationId);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">🔍</span>
        <input
          type="text"
          inputMode="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Search station…'}
          className="premium-input w-full pl-11 pr-4 py-4"
        />
      </div>

      {query.trim().length > 0 && (
        <div className="card overflow-hidden max-h-64 overflow-y-auto divide-y divide-white/5">
          {filteredResults.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No stations match &ldquo;{query}&rdquo;
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
