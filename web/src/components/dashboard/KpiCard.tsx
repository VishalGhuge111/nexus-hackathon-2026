'use client';
import React, { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

interface KpiCardProps {
  label: string;
  value: number | null;
  unit?: string;
  prefix?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'ok' | 'warn' | 'critical';
  note?: string;
}

function KpiValue({ value, prefix, unit }: { value: number | null; prefix?: string; unit?: string }) {
  const count = useCountUp(value ?? 0);
  if (value === null) {
    return <span className="text-2xl font-bold font-mono tabular-nums text-zinc-300">—</span>;
  }
  return (
    <>
      <span className="text-2xl font-bold font-mono tabular-nums tracking-tight">
        {prefix}{count.toLocaleString('en-IN')}
      </span>
      {unit && <span className="text-xs text-zinc-400 font-medium pb-0.5">{unit}</span>}
    </>
  );
}

export function KpiCard({ label, value, unit, prefix, icon, trend, status = 'ok', note }: KpiCardProps) {
  const borderClass =
    status === 'critical'
      ? 'border-red-200 bg-red-50/20'
      : status === 'warn'
      ? 'border-amber-200 bg-amber-50/20'
      : 'border-zinc-200/80 bg-white';

  const iconBg =
    status === 'critical'
      ? 'bg-red-100/80 text-red-600'
      : status === 'warn'
      ? 'bg-amber-100/80 text-amber-600'
      : 'bg-zinc-100 text-zinc-600';

  const valueColor =
    value === null
      ? 'text-zinc-400'
      : status === 'critical'
      ? 'text-red-700'
      : status === 'warn'
      ? 'text-amber-700'
      : 'text-zinc-900';

  return (
    <div className={`border ${borderClass} rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-zinc-300 hover:shadow-xs group select-none`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider truncate">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className={`flex items-baseline gap-1 my-1 ${valueColor}`}>
        <KpiValue value={value} prefix={prefix} unit={unit} />
      </div>

      <div className="pt-2 border-t border-zinc-100/80 mt-1 flex items-center justify-between text-xs">
        {value === null ? (
          <span className="text-zinc-400 text-[11px]">{note ?? 'Awaiting data'}</span>
        ) : (
          <div
            className={`inline-flex items-center gap-1 font-medium text-[11px] ${
              status === 'critical'
                ? 'text-red-600'
                : status === 'warn'
                ? 'text-amber-600'
                : 'text-emerald-700'
            }`}
          >
            {trend === 'down' ? (
              <TrendingDown size={12} strokeWidth={2.5} />
            ) : trend === 'up' ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : (
              <Minus size={12} strokeWidth={2.5} />
            )}
            <span>
              {status === 'critical'
                ? 'Action Required'
                : status === 'warn'
                ? 'Under Surveillance'
                : 'Within Threshold'}
            </span>
          </div>
        )}
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Live</span>
      </div>
    </div>
  );
}