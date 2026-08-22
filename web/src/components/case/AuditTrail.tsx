import React from 'react';
import type { AuditEvent } from '../../../../shared/types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  if (!events || events.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Audit Trail" subtitle="System & Agent Event Log" />
      <div className="relative pl-4 border-l border-gray-800 ml-2 space-y-6 mt-4">
        {events.map((evt, i) => {
          const isAgent = evt.actor === 'AGENT';
          const isHuman = evt.actor === 'HUMAN';
          
          return (
            <div key={evt.id || i} className="relative">
              <div className={`absolute -left-[21px] w-3 h-3 rounded-full mt-1.5 border-2 border-gray-900
                ${isAgent ? 'bg-blue-500' : isHuman ? 'bg-amber-500' : 'bg-gray-500'}`} 
              />
              <div className="pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge variant={isAgent ? 'default' : isHuman ? 'warning' : 'default'} className="bg-transparent border-0 text-[10px]">
                    {evt.actor}
                  </Badge>
                  <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">{evt.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm text-gray-300 font-mono mb-2">{evt.summary}</p>
                {evt.detail && Object.keys(evt.detail).length > 0 && (
                  <div className="text-xs text-gray-500 font-mono bg-gray-950 p-2 rounded border border-gray-800">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(evt.detail, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
