/* Premium splash screen */
export default function LocationPermission({ status, onAllow }) {
  const isDenied = status === 'denied';

  return (
    <div className="relative flex flex-col min-h-dvh bg-[#09090b] overflow-hidden">

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="flex-1 flex flex-col justify-end px-5 pb-10 pt-safe">

        {/* Big icon area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-6">

          {/* Metro icon — fintech card style */}
          <div className="anim-slide-up">
            <div className="relative">
              <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-2xl"
                style={{ boxShadow: '0 20px 60px rgba(99,102,241,0.4)' }}>
                <span className="text-5xl">🚇</span>
              </div>
              {/* Live badge */}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full px-2 py-0.5 flex items-center gap-1 border-2 border-[#09090b]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-dot-blink" />
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            </div>
          </div>

          {/* Tag */}
          <div className="anim-slide-up anim-delay-1 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
            <span className="text-xs font-semibold text-indigo-400 tracking-widest uppercase">Hyderabad Metro</span>
          </div>

          {/* Headline */}
          <div className="anim-slide-up anim-delay-1 text-center space-y-3 px-2">
            <h1 className="text-[2rem] font-black text-white tracking-tight leading-[1.15]">
              Never miss<br />your stop.
            </h1>
            <p className="text-[15px] text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
              Auto-detects your station. Rings an alarm the moment you arrive — even when your screen is locked.
            </p>
          </div>

          {/* Feature rows — fintech card style */}
          <div className="anim-slide-up anim-delay-2 w-full max-w-sm space-y-2.5">
            {[
              { icon: '📍', title: 'Auto station detection', sub: 'GPS-based, no manual input needed' },
              { icon: '🔔', title: 'Alarm on arrival', sub: 'Sound + vibration at 500m & 200m' },
              { icon: '🔒', title: 'Works with screen off', sub: 'PWA background keeps GPS active' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="card flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {isDenied && (
          <div className="anim-fade-in mb-4 card border-rose-500/30 bg-rose-500/5 px-4 py-3 flex gap-3 items-start">
            <span className="text-rose-400 mt-0.5">⚠️</span>
            <p className="text-sm text-rose-400 leading-snug">
              Location was blocked. Go to your browser settings → enable location for this site → tap below.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="anim-slide-up anim-delay-3 space-y-3">
          <button onClick={onAllow} className="btn-primary">
            <span>📍</span>
            <span>{isDenied ? 'Retry Location Access' : 'Allow Location & Continue'}</span>
          </button>
          <p className="text-center text-xs text-zinc-600">
            Your location never leaves your device
          </p>
        </div>
      </div>
    </div>
  );
}
