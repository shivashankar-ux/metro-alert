export default function ArrivalAlert({ destinationStation, onStartNew }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center px-6 text-center">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative space-y-6 max-w-xs">
        {/* Big check icon */}
        <div className="anim-scale-in mx-auto w-28 h-28 rounded-[32px] bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
          style={{ boxShadow: '0 0 60px rgba(16,185,129,0.2)' }}>
          <span className="text-6xl">✅</span>
        </div>

        {/* Text */}
        <div className="anim-slide-up anim-delay-1 space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Arrived</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">You're here!</h1>
          <p className="text-zinc-400 text-[15px]">
            Welcome to <span className="text-white font-semibold">{destinationStation.name}</span>
          </p>
        </div>

        {/* Stats row */}
        <div className="anim-slide-up anim-delay-2 card px-5 py-4">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Journey Complete</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-600">Destination</p>
              <p className="text-sm font-bold text-white mt-0.5">{destinationStation.name}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-400 text-sm">✓</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="anim-slide-up anim-delay-3">
          <button onClick={onStartNew} className="btn-primary">
            <span>🚇</span>
            <span>Start New Journey</span>
          </button>
        </div>
      </div>
    </div>
  );
}
