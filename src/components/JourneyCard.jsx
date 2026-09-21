const LINE_COLORS = {
  'Red Line': 'bg-line-red',
  'Blue Line': 'bg-line-blue',
  'Green Line': 'bg-line-green'
};

export default function JourneyCard({ boardingStation, destinationStation }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center pt-1">
          <span className={`w-3 h-3 rounded-full ${LINE_COLORS[boardingStation.line] || 'bg-gray-400'}`} />
          <span className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1 min-h-[2rem]" />
          <span className={`w-3 h-3 rounded-full ${LINE_COLORS[destinationStation.line] || 'bg-gray-400'}`} />
        </div>
        <div className="flex-1 flex flex-col justify-between min-h-[4.5rem]">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Boarding</p>
            <p className="font-semibold">{boardingStation.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Destination</p>
            <p className="font-semibold">{destinationStation.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
