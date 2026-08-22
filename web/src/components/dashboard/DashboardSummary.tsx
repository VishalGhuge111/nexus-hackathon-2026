'use client';
import React, { useEffect, useState } from 'react';
import { Package, ShieldAlert, FileWarning, DollarSign } from 'lucide-react';
import { useMission } from '../../contexts/MissionContext';

// Animated number component
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString(undefined, { maximumFractionDigits: displayValue > 10 ? 0 : 1 })}{suffix}</span>;
}

export function DashboardSummary() {
  const { kpis, scenario } = useMission();
  
  // Adjust KPIs slightly based on scenario to show reactivity
  const adjustedKpis = {
    ordersSafe: scenario === 'HEALTHY' ? kpis.ordersSafe + 42 : scenario === 'WARNING' ? kpis.ordersSafe + 10 : kpis.ordersSafe,
    ordersAtRisk: scenario === 'HEALTHY' ? 0 : scenario === 'WARNING' ? 32 : kpis.ordersAtRisk,
    coverage: scenario === 'HEALTHY' ? 14.5 : scenario === 'WARNING' ? 5.2 : kpis.coverage,
    recoveryCost: scenario === 'HEALTHY' ? 0 : scenario === 'WARNING' ? 4200 : kpis.recoveryCost,
  };

  const metrics = [
    {
      title: "Orders Safe",
      value: adjustedKpis.ordersSafe,
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      trend: "+12% vs last week"
    },
    {
      title: "Orders At Risk",
      value: adjustedKpis.ordersAtRisk,
      icon: ShieldAlert,
      color: scenario === 'HEALTHY' ? "text-emerald-600" : "text-amber-600",
      bg: scenario === 'HEALTHY' ? "bg-emerald-100" : "bg-amber-100",
      trend: "Requires attention"
    },
    {
      title: "Coverage Remaining",
      value: adjustedKpis.coverage,
      suffix: " Days",
      icon: FileWarning,
      color: scenario === 'RECOVERY' || scenario === 'APPROVAL' ? "text-red-600" : "text-blue-600",
      bg: scenario === 'RECOVERY' || scenario === 'APPROVAL' ? "bg-red-100" : "bg-blue-100",
      trend: "Based on current inventory"
    },
    {
      title: "Est. Recovery Cost",
      value: adjustedKpis.recoveryCost,
      prefix: "₹",
      icon: DollarSign,
      color: "text-zinc-600",
      bg: "bg-zinc-100",
      trend: "Projected impact"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-600">{m.title}</h3>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.bg}`}>
              <m.icon size={16} className={m.color} />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mb-1">
            <AnimatedNumber value={m.value} prefix={m.prefix} suffix={m.suffix} />
          </div>
          <div className="text-xs text-zinc-500">{m.trend}</div>
        </div>
      ))}
    </div>
  );
}