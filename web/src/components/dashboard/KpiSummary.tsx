import React from 'react';
import { Card } from '../ui/Card';

export function KpiSummary({ coverageDays, unitsAtRisk, emergencyBudget }: { coverageDays: number, unitsAtRisk: number, emergencyBudget: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      <Card className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.1em] mb-2">Coverage Days</p>
        <p className={	ext-5xl font-black tracking-tighter tabular-nums }>
          {coverageDays} <span className="text-sm font-medium tracking-normal text-muted-foreground uppercase">days</span>
        </p>
      </Card>
      
      <Card className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.1em] mb-2">Units at Risk</p>
        <p className={	ext-5xl font-black tracking-tighter tabular-nums }>
          {unitsAtRisk.toLocaleString()}
        </p>
      </Card>

      <Card className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.1em] mb-2">Emergency Budget</p>
        <p className="text-5xl font-black tracking-tighter tabular-nums text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
          
        </p>
      </Card>
    </div>
  );
}
