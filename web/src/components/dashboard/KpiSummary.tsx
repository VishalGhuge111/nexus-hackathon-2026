import React from 'react';
import { Card } from '../ui/Card';

export function KpiSummary({ coverageDays, unitsAtRisk, emergencyBudget }: { coverageDays: number, unitsAtRisk: number, emergencyBudget: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6">
      <Card className="p-6">
        <p className="text-sm text-muted-foreground font-medium mb-1">Coverage Days</p>
        <p className={`text-4xl font-bold tabular-nums ${coverageDays < 14 ? 'text-red-600' : 'text-foreground'}`}>
          {coverageDays} <span className="text-lg font-normal text-muted-foreground">days</span>
        </p>
      </Card>
      
      <Card className="p-6">
        <p className="text-sm text-muted-foreground font-medium mb-1">Units at Risk</p>
        <p className={`text-4xl font-bold tabular-nums ${unitsAtRisk > 0 ? 'text-amber-600' : 'text-foreground'}`}>
          {unitsAtRisk.toLocaleString()}
        </p>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-muted-foreground font-medium mb-1">Emergency Budget</p>
        <p className="text-4xl font-bold tabular-nums text-emerald-600">
          ${emergencyBudget.toLocaleString()}
        </p>
      </Card>
    </div>
  );
}
