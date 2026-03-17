import { HardDrive } from 'lucide-react';

export default function StorageWidget({ isCollapsed, storageData }) {
  if (storageData === undefined || storageData === null) return null;

  const { totalGB, limitGB, percentage } = storageData;

  const barColor =
    percentage >= 90
      ? 'bg-red-500'
      : percentage >= 70
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const formattedGB = totalGB.toFixed(2);
  const formattedPct = Math.round(percentage);

  if (isCollapsed) {
    return (
      <div className="flex justify-center px-2 py-2 mb-1">
        <HardDrive size={20} className="text-emerald-400 flex-shrink-0" />
      </div>
    );
  }

  return (
    <div className="mx-2 mb-2 px-3 py-3 bg-white/5 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <HardDrive size={14} className="text-emerald-400 flex-shrink-0" />
        <span className="text-xs font-medium text-[#adb5bd]">Spazio Storage</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-[#adb5bd]">
        {formattedGB} GB / {limitGB} GB
        <span className="ml-1 text-[#6c757d]">· {formattedPct}%</span>
      </p>
    </div>
  );
}
