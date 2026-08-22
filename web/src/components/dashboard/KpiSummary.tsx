import React from 'react';
import { Card } from '../ui/Card';

export function KpiSummary({ coverageDays, unitsAtRisk, emergencyBudget }: { coverageDays: number, unitsAtRisk: number, emergencyBudget: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <p className="text-sm text-gray-400 font-mono mb-1">Coverage Days</p>
        <p className={`text-4xl font-bold tabular-nums ${coverageDays < 14 ? 'text-red-400' : 'text-gray-100'}`}>
          {coverageDays} <span className="text-lg text-gray-500 font-normal">days</span>
        </p>
      </Card>
      
      <Card>
        <p className="text-sm text-gray-400 font-mono mb-1">Units at Risk</p>
        <p className={`text-4xl font-bold tabular-nums ${unitsAtRisk > 0 ? 'text-amber-400' : 'text-gray-100'}`}>
          {unitsAtRisk.toLocaleString()}
        </p>
      </Card>

      <Card>
        <p className="text-sm text-gray-400 font-mono mb-1">Emergency Budget</p>
        <p className="text-4xl font-bold tabular-nums text-green-400">
          ${emergencyBudget.toLocaleString()}
        </p>
      </Card>
    </div>
  );
}
