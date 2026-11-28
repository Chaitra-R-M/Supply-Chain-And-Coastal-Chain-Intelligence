import React from 'react';

const LEVEL_STYLES = {
  Low: { arc: '#22c55e', text: 'text-emerald-600 dark:text-emerald-400' },
  Moderate: { arc: '#b89f47', text: 'text-eggshell-600 dark:text-eggshell-400' },
  High: { arc: '#f97316', text: 'text-orange-600 dark:text-orange-400' },
  Critical: { arc: '#ef4444', text: 'text-rose-600 dark:text-rose-400' },
};

export default function CongestionGauge({ level = 'Moderate', utilizationPct = 62 }) {
  const clamped = Math.max(0, Math.min(100, Number(utilizationPct) || 0));
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.Moderate;
  // Semi-circle path length for r=64: pi * 64 = 201.06
  const radius = 64;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative h-32 w-52">
        <svg viewBox="0 0 160 95" className="h-full w-full overflow-visible">
          {/* Background track */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            className="text-dusty-denim-100 dark:text-deep-space-blue-800"
          />
          {/* Progress arc */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke={style.arc}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
          <span className={`text-sm font-bold ${style.text}`}>{level}</span>
          <span className="text-2xl font-extrabold tracking-tight text-ink-black-900 dark:text-ink-black-50">
            {Math.round(clamped)}%
          </span>
          <span className="text-[11px] font-medium text-dusty-denim-500 dark:text-blue-slate-300">
            Utilization
          </span>
        </div>
      </div>
    </div>
  );
}
