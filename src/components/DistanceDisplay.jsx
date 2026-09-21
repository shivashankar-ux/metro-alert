import { formatDistance } from '../services/distance.js';

export default function DistanceDisplay({ distanceMeters }) {
  return (
    <div className="text-center py-4">
      <p className="text-5xl font-bold tabular-nums">{formatDistance(distanceMeters)}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">to destination</p>
    </div>
  );
}
