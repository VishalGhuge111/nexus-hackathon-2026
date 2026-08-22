import React from 'react';
import type { RiskSignal } from '../../../../shared/types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function RiskSignals({ signals }: { signals: RiskSignal[] }) {
  if (!signals || signals.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader title="Risk Signals" subtitle="Detected Disruptions" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map(s => (
          <div key={s.id} className="border border-red-900/50 bg-red-950/20 p-4 rounded-md">
            <div className="flex justify-between items-start mb-2">
              <span className="text-red-400 font-mono font-bold">{s.indicator.replace(/_/g, ' ')}</span>
              <Badge variant="critical">EXCEEDS THRESHOLD</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 font-mono">Value: </span>
                <span className="text-gray-300 font-mono">{s.value}</span>
              </div>
              <div>
                <span className="text-gray-500 font-mono">Threshold: </span>
                <span className="text-gray-300 font-mono">{s.threshold}</span>
              </div>
              <div>
                <span className="text-gray-500 font-mono">Source: </span>
                <span className="text-gray-300 uppercase">{s.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
