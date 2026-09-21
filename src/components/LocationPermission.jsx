export default function LocationPermission({ status, onAllow }) {
  const isDenied = status === 'denied';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-4xl">
        📍
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Location access needed</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Metro Alert uses your location to detect your boarding station and notify you when
          you reach your destination. Your location is processed locally and never sent to a
          server.
        </p>
      </div>

      {isDenied && (
        <p className="text-sm text-rose-500 max-w-xs">
          Location permission was denied. Please enable location access for this site in your
          browser settings, then try again.
        </p>
      )}

      <button
        onClick={onAllow}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-blue-600 text-white font-medium text-base active:scale-[0.98] transition"
      >
        Allow Location
      </button>
    </div>
  );
}
