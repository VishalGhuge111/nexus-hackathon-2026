'use client';
import React, { useState } from 'react';
import { usePolling, resolveApproval, type CaseDetail } from '../../lib/api-client';
import { Badge } from '../ui/Badge';
import { X, Map, Activity, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export function CaseDetailPanel({ caseId, onClose }: { caseId: string, onClose: () => void }) {
  const { data, isLoading, error, mutate } = usePolling<CaseDetail>(`/api/cases/${caseId}`, 3000);
  const [resolving, setResolving] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border-l border-neutral-200">
        <p className="text-neutral-500 font-medium animate-pulse">Loading details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-l border-neutral-200 p-6">
        <AlertCircle className="text-red-500 mb-2" size={32} />
        <h2 className="text-red-600 font-bold mb-1">Failed to Load Case</h2>
        <p className="text-neutral-500 text-sm">{error?.message || 'Case not found'}</p>
        <button onClick={onClose} className="mt-4 text-blue-600 hover:underline text-sm">Close Panel</button>
      </div>
    );
  }

  const { caseRecord, agentState, auditEvents } = data;

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setResolving(true);
    try {
      await resolveApproval(caseId, decision);
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="w-full h-full bg-white border-l border-neutral-200 flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center p-6 border-b border-neutral-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-neutral-900">{caseRecord.id}</h2>
          <button className="text-neutral-400 hover:text-neutral-600"><Map size={16} /></button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            caseRecord.status === 'GOAL_ACHIEVED' ? 'success' :
            caseRecord.status === 'HUMAN_ESCALATED_AWAITING_DECISION' ? 'warning' : 'default'
          }>
            {caseRecord.status.replace(/_/g, ' ')}
          </Badge>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full transition-colors ml-2 text-neutral-400 hover:text-neutral-900">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-400 mb-1">Order Ref</p>
            <p className="font-medium text-neutral-900">{caseRecord.productionOrderId}</p>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Priority</p>
            <Badge variant={caseRecord.priority === 'CRITICAL' ? 'critical' : 'default'}>{caseRecord.priority}</Badge>
          </div>
          <div>
            <p className="text-neutral-400 mb-1">Continuity Impact</p>
            <p className="font-medium text-neutral-900">{caseRecord.continuityImpact?.unitsAtRisk?.toLocaleString()} units at risk</p>
          </div>
        </div>

        <div className="w-full h-px bg-neutral-100" />

        {/* Action Required Panel */}
        {caseRecord.status === 'HUMAN_ESCALATED_AWAITING_DECISION' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-amber-900">Human Approval Required</h3>
                <p className="text-amber-700 text-sm mt-1 mb-4">The Agent has validated a recovery plan that exceeds automated approval thresholds.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision('REJECTED')}
                    disabled={resolving}
                    className="flex-1 bg-white border border-amber-300 text-amber-700 hover:bg-amber-100 font-bold py-2 px-3 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    Reject Plan
                  </button>
                  <button
                    onClick={() => handleDecision('APPROVED')}
                    disabled={resolving}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {resolving ? 'Processing...' : 'Authorize Execution'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FSM Tracker (Simplified) */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <Activity size={16} className="text-neutral-400" /> Lifecycle Status
          </h3>
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <p className="text-sm text-neutral-700 font-medium capitalize">{caseRecord.status.replace(/_/g, ' ').toLowerCase()}</p>
          </div>
        </div>

        {/* Risk Signals */}
        {caseRecord.riskSignals && caseRecord.riskSignals.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-400" /> Active Risks
            </h3>
            <div className="space-y-2">
              {caseRecord.riskSignals.map((s: any) => (
                <div key={s.id} className="p-3 border border-red-200 bg-red-50 rounded-md text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-red-800">{s.indicator.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-red-600 bg-red-100 px-2 rounded-full py-0.5 font-bold border border-red-200">EXCEEDS</span>
                  </div>
                  <div className="text-red-700 text-xs">
                    Value: {s.value} | Threshold: {s.threshold}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-neutral-400" /> Audit Trail
          </h3>
          <div className="relative pl-3 space-y-4">
            <div className="absolute left-[3px] top-2 bottom-2 w-px bg-neutral-200" />
            {auditEvents.slice(-5).map((evt: any, i: number) => (
              <div key={evt.id || i} className="relative pl-4">
                <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-neutral-300" />
                <div className="text-xs text-neutral-500 mb-0.5 flex gap-2 items-center">
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded uppercase text-[9px] font-bold tracking-wider">{evt.actor}</span>
                </div>
                <p className="text-sm text-neutral-800 leading-snug">{evt.summary}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
