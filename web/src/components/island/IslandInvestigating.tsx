import React from 'react';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { HorizontalTimeline } from './HorizontalTimeline';
import { DecisionActivity } from './DecisionActivity';
import type { CaseDetail } from '../../lib/api-client';

export function IslandInvestigating({ detail }: { detail: CaseDetail }) {
  const { caseRecord, auditEvents } = detail;
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-900">Shipment Delay Detected</h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            {caseRecord.productionOrderId} · Bearing Assembly
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Progress</p>
        <HorizontalTimeline completedCount={3} />
      </div>

      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">NEXUS is checking</p>
        <div className="space-y-2">
          {['Inventory levels', 'Shipment tracking data', 'Supplier communications'].map((item, i) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              {i < 2 ? <CheckCircle size={14} className="text-emerald-500" /> : <Loader size={14} className="text-blue-400 animate-spin" />}
              <span className={i < 2 ? 'text-zinc-700' : 'text-blue-600 font-medium'}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-4">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Decision Activity</p>
        <DecisionActivity events={auditEvents} />
      </div>
    </div>
  );
}