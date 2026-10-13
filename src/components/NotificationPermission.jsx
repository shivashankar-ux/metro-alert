export default function NotificationPermission({ permission, onRequest }) {
  if (permission === 'granted' || permission === 'unsupported') return null;

  if (permission === 'denied') {
    return (
      <div className="card border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
        <span className="text-amber-400 text-base">🔕</span>
        <p className="text-xs text-amber-400 leading-snug">
          Notifications blocked. Keep the app open to see arrival alerts.
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={onRequest}
      className="w-full card card-pressed px-4 py-3.5 flex items-center gap-3 text-left"
    >
      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-base">🔔</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Enable notifications</p>
        <p className="text-xs text-zinc-500 mt-0.5">Get alerted even when app is in background</p>
      </div>
      <span className="text-xs font-bold text-indigo-400 flex-shrink-0">Enable →</span>
    </button>
  );
}
