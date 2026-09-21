export default function NotificationPermission({ permission, onRequest }) {
  if (permission === 'granted' || permission === 'unsupported') return null;

  if (permission === 'denied') {
    return (
      <p className="text-xs text-center text-amber-600 dark:text-amber-400">
        Notifications are disabled. Keep the app open to see the arrival alert.
      </p>
    );
  }

  return (
    <button
      onClick={onRequest}
      className="w-full text-sm py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
    >
      Enable arrival notifications
    </button>
  );
}
