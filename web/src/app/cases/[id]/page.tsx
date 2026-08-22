'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { usePolling, type CaseDetail } from '../../../lib/api-client';
import { FsmTracker } from '../../../components/case/FsmTracker';
import { RiskSignals } from '../../../components/case/RiskSignals';
import { RecoveryPlan } from '../../../components/case/RecoveryPlan';
import { ApprovalGate } from '../../../components/case/ApprovalGate';
import { AuditTrail } from '../../../components/case/AuditTrail';
import { Badge } from '../../../components/ui/Badge';

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, isLoading, error, mutate } = usePolling<CaseDetail>(`/api/cases/${resolvedParams.id}`, 3000);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 font-mono animate-pulse">Establishing Case Telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-red-900 bg-red-950/20 p-6 rounded-lg text-center mt-8 max-w-2xl mx-auto">
        <h2 className="text-red-500 font-bold font-mono mb-2">TELEMETRY LINK FAILED</h2>
        <p className="text-red-400 font-mono text-sm">{error?.message || 'Case not found'}</p>
        <div className="mt-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-mono text-sm underline">&larr; Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { caseRecord, agentState, auditEvents } = data;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-mono text-xs uppercase tracking-wider mb-4 inline-block">&larr; Dashboard</Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-100 tracking-tight">{caseRecord.id}</h1>
            <Badge variant={caseRecord.priority === 'CRITICAL' ? 'critical' : 'default'}>{caseRecord.priority}</Badge>
            <Badge variant="default" className="bg-gray-800 border-gray-700 text-gray-300">{caseRecord.status.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-gray-400 font-mono text-sm mt-2">Order Ref: {caseRecord.productionOrderId}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-mono mb-1">Impact Exposure</p>
          <p className="text-xl font-bold tabular-nums text-amber-400">{caseRecord.continuityImpact.unitsAtRisk.toLocaleString()} units</p>
        </div>
      </header>

      <FsmTracker currentStep={caseRecord.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <RiskSignals signals={caseRecord.riskSignals} />
          
          <ApprovalGate 
            caseId={caseRecord.id} 
            status={caseRecord.status} 
            onResolved={() => mutate()} 
          />

          <RecoveryPlan 
            plan={auditEvents.find(e => e.type === 'TOOL_CALL' && e.summary.includes('calculate_recovery_plan'))?.detail}
            validation={auditEvents.find(e => e.type === 'VALIDATION')?.detail}
          />
        </div>
        
        <div className="lg:col-span-1">
          <AuditTrail events={auditEvents} />
        </div>
      </div>
    </div>
  );
}
