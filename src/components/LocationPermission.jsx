export default function LocationPermission({ status, onAllow }) {
  const isDenied = status === 'denied';

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh px-6 py-10 text-center overflow-hidden">

      {/* Background glow orbs */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-40px] w-[240px] h-[240px] bg-indigo-600/15 rounded-full blur-[70px] pointer-events-none" />

      {/* Metro icon badge */}
      <div className="animate-float-up relative mb-8">
        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-600/40 animate-glow-pulse">
          <span className="text-5xl">🚇</span>
        </div>
        {/* Live ping dot */}
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-gray-950" />
        </span>
      </div>

      {/* Headline */}
      <div className="animate-float-up space-y-3 mb-8" style={{ animationDelay: '80ms' }}>
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Hyderabad Metro Alert</span>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
          Never miss your<br />
          <span className="shimmer-text">station again.</span>
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
          Metro Alert auto-detects your boarding station and vibrates + rings an alarm when you're approaching your destination — even when your phone is locked.
        </p>
      </div>

      {/* Feature pills */}
      <div className="animate-float-up flex flex-wrap justify-center gap-2 mb-8" style={{ animationDelay: '160ms' }}>
        {[
          { icon: '📍', label: 'Auto-detects station' },
          { icon: '🔔', label: 'Alarm on arrival' },
          { icon: '🔒', label: 'Works when locked' },
          { icon: '🛡️', label: 'Data stays on device' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
          >
            <span>{icon}</span>
            <span>{label}</span>
          </span>
        ))}
      </div>

      {/* Error state */}
      {isDenied && (
        <div className="animate-float-up w-full max-w-xs mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400 text-left flex items-start gap-2">
          <span className="text-base mt-0.5">⚠️</span>
          <span>Location was denied. Go to your browser settings, enable location for this site, then tap below.</span>
        </div>
      )}

      {/* CTA button */}
      <div className="animate-float-up w-full max-w-xs" style={{ animationDelay: '240ms' }}>
        <button
          onClick={onAllow}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.97] transition-all duration-200 text-white font-bold text-base shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 animate-gradient"
        >
          <span>📍</span>
          <span>{isDenied ? 'Retry Location Access' : 'Enable Location & Start'}</span>
        </button>
        <p className="mt-3 text-xs text-gray-600 text-center">
          Your location is never uploaded to any server.
        </p>
      </div>
    </div>
  );
}
