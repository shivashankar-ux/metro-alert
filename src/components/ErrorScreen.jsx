const MESSAGES = {
  'location-denied': 'Location permission is required to automatically detect your metro station.',
  'location-unavailable': "We couldn't get your location. Please check your device GPS.",
  'location-timeout': 'GPS is taking too long. Please move to an area with better signal.',
  'no-station': "We couldn't confidently detect a nearby metro station.",
  unsupported: "Your browser doesn't support the features Metro Alert needs (Geolocation)."
};

export default function ErrorScreen({ kind, onRetry }) {
  const message = MESSAGES[kind] || 'Something went wrong.';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-3xl">
        ⚠️
      </div>
      <p className="text-gray-600 dark:text-gray-300 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
