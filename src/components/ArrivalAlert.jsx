export default function ArrivalAlert({ destinationStation, onStartNew }) {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-5xl">
        ✅
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">You're here!</h1>
        <p className="text-gray-500 dark:text-gray-400">You've reached {destinationStation.name}.</p>
      </div>
      <button
        onClick={onStartNew}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-blue-600 text-white font-medium text-base active:scale-[0.98] transition"
      >
        Start New Journey
      </button>
    </div>
  );
}
