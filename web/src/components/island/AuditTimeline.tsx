import React from 'react';
import type { AuditEvent } from '../../../../shared/types';

const COLOR_MAP = {
  SYSTEM_CRIT: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  SYSTEM_WARN: { dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  AGENT: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  SUCCESS: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

function getStyle(evt: AuditEvent) {
  if (evt.type === 'STATE_TRANSITION' && evt.summary.toLowerCase().includes('delay')) return COLOR_MAP.SYSTEM_CRIT;
  if (evt.type === 'STATE_TRANSITION' && evt.summary.toLowerCase().includes('escalat')) return COLOR_MAP.SYSTEM_WARN;
  if (evt.actor === 'AGENT') return COLOR_MAP.AGENT;
  if (evt.type === 'VALIDATION' && (evt.detail as any)?.passed) return COLOR_MAP.SUCCESS;
  return COLOR_MAP.SYSTEM_WARN;
}

const LABEL_MAP: Record<string, string> = {
  'Inventory sufficient': 'Inventory sufficient for 2.1 days',
  'Backup suppliers': 'Backup suppliers contacted — 3 alternatives found',
  'Recovery plan generated': 'Supplier B identified as best option',
  'Recovery plan satisfies': 'Recovery plan satisfies all constraints',
  'Cost exceeds': 'Escalating to operator — cost exceeds auto-approval threshold',
  'Shipment tracking': 'Shipment delay detected — 7 days',
};
function humanize(s: string) {
  for (const [k, v] of Object.entries(LABEL_MAP)) { if (s.includes(k)) return v; }
  return s;
}

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="px-6 pb-8">
      <h2 className="text-sm font-bold text-zinc-900 mb-5 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded-full inline-block" />
        Incident Replay
      </h2>
      <div className="relative pl-5">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-zinc-200" />
        <div className="space-y-4">
          {events.map((evt, i) => {
            const s = getStyle(evt);
            return (
              <div key={evt.id || i} className="relative">
                <div className={`absolute -left-[17px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${s.dot}`} />
                <div className={`ml-1 p-3 rounded-lg border ${s.bg} ${s.border}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${s.bg} ${s.text}`}>{evt.actor}</span>
                  </div>
                  <p className={`text-xs font-medium ${s.text}`}>{humanize(evt.summary)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}