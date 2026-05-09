export default function QuotaBar({ current, max }) {
  const pct = max ? Math.min(100, (current / max) * 100) : 0;
  const isFull = current >= max;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 whitespace-nowrap">{current}/{max}</span>
    </div>
  );
}
