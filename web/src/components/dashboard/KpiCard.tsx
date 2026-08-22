'use client';
import React, { useEffect, useRef, useState } from 'react';
import { TrendingDown, TrendingUp, Shield, DollarSign, Activity } from 'lucide-react';

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); } else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

interface KpiCardProps { label: string; value: number | null; unit?: string; prefix?: string; icon: React.ReactNode; trend?: 'up' | 'down' | 'neutral'; status?: 'ok' | 'warn' | 'critical'; note?: string; }

function KpiValue({ value, prefix, unit }: { value: number | null; prefix?: string; unit?: string }) {
  const count = useCountUp(value ?? 0);
  if (value === null) {
    return <span className="text-3xl font-black tabular-nums text-zinc-300">&mdash;</span>;
  }
  return (
    <>
      <span className="text-3xl font-black tabular-nums">{prefix}{count.toLocaleString()}</span>
      {unit && <span className="text-sm text-zinc-400 font-medium pb-0.5">{unit}</span>}
    </>
  );
}

export function KpiCard({ label, value, unit, prefix, icon, trend, status = 'ok', note }: KpiCardProps) {
  const borderColor = status === 'critical' ? 'border-red-200' : status === 'warn' ? 'border-amber-200' : 'border-zinc-200';
  const valueColor = value === null ? '' : status === 'critical' ? 'text-red-600' : status === 'warn' ? 'text-amber-600' : 'text-zinc-900';

  return (
    <div className={`bg-white border ${borderColor} rounded-lg p-5 shadow-sm flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
        <div className="text-zinc-300">{icon}</div>
      </div>
      <div className={`flex items-end gap-1.5 ${valueColor}`}>
        <KpiValue value={value} prefix={prefix} unit={unit} />
      </div>
      {value === null ? (
        <div className="text-xs font-medium text-zinc-400">{note ?? 'No data'}</div>
      ) : (
        trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'down' ? 'text-red-500' : trend === 'up' ? 'text-emerald-600' : 'text-zinc-400'}`}>
            {trend === 'down' ? <TrendingDown size={12} /> : trend === 'up' ? <TrendingUp size={12} /> : null}
            <span>{trend === 'down' ? 'Declining' : trend === 'up' ? 'Improving' : 'Stable'}</span>
          </div>
        )
      )}
    </div>
  );
}