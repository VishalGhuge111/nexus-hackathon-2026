import React from 'react';
import type { Case } from '../../../../shared/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function ActiveCasesList({ cases, selectedCaseId, onSelect }: { cases: Case[], selectedCaseId: string | null, onSelect: (id: string) => void }) {
  if (!cases || cases.length === 0) {
    return (
      <Card className="p-12 text-center text-neutral-500 font-mono">
        No active cases detected. Operational status normal.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <div className="flex gap-4 border-b border-neutral-200 pb-2 mb-2 px-2 text-sm text-neutral-500 font-medium overflow-x-auto">
        <button className="text-neutral-900 border-b-2 border-neutral-900 pb-2 -mb-[9px]">All <span className="ml-1 bg-neutral-200 text-neutral-700 px-1.5 rounded-full text-xs">{cases.length}</span></button>
        <button className="hover:text-neutral-900 transition-colors">OPEN</button>
        <button className="hover:text-neutral-900 transition-colors">PLAN</button>
        <button className="hover:text-neutral-900 transition-colors">VALIDATE</button>
        <button className="hover:text-neutral-900 transition-colors">GOAL_ACHIEVED</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((c) => {
          const isSelected = selectedCaseId === c.id;
          return (
            <div 
              key={c.id} 
              onClick={() => onSelect(c.id)}
              className={`bg-white rounded-lg shadow-sm p-4 transition-all cursor-pointer group border ${isSelected ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-neutral-900">{c.id}</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">{c.productionOrderId}</p>
                </div>
                <Badge variant={
                  c.status === 'GOAL_ACHIEVED' ? 'success' :
                  c.status === 'HUMAN_ESCALATED_AWAITING_DECISION' ? 'warning' : 'default'
                }>
                  {c.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wider">Priority</p>
                  <Badge variant={c.priority === 'CRITICAL' ? 'critical' : 'default'} className="!text-[10px]">
                    {c.priority}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-xs text-neutral-400 mb-1 uppercase tracking-wider">Continuity Impact</p>
                  <p className="text-sm font-medium text-neutral-700">{c.continuityImpact?.unitsAtRisk?.toLocaleString() || '0'} units</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                 <div className="flex gap-1">
                   {c.riskSignals?.slice(0,3).map((rs: any, idx: number) => (
                     <span key={idx} className="w-2 h-2 rounded-full bg-red-400" title={rs.type} />
                   ))}
                   {(!c.riskSignals || c.riskSignals.length === 0) && (
                     <span className="text-xs text-neutral-400">No active risks</span>
                   )}
                 </div>
                 <span className={`text-xs font-semibold transition-colors ${isSelected ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-900'}`}>Details &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
