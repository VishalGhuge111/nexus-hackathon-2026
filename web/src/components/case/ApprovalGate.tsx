import React, { useState } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { resolveApproval } from '../../lib/api-client';

export function ApprovalGate({ caseId, status, onResolved }: { caseId: string, status: string, onResolved: () => void }) {
  const [loading, setLoading] = useState(false);

  if (status !== 'HUMAN_ESCALATED_AWAITING_DECISION') return null;

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await resolveApproval(caseId, decision);
      onResolved();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-amber-500 bg-amber-950/10">
      <CardHeader title="Human Approval Required" subtitle="Agent Escalation" />
      <p className="text-gray-300 mb-6 font-mono text-sm">
        The Agent has validated a recovery plan that exceeds automated approval thresholds. 
        Ops Controller authorization is required to proceed with execution.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => handleDecision('APPROVED')}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded font-mono transition-colors disabled:opacity-50"
        >
          {loading ? 'PROCESSING...' : 'AUTHORIZE EXECUTION'}
        </button>
        <button
          onClick={() => handleDecision('REJECTED')}
          disabled={loading}
          className="flex-1 bg-red-900 hover:bg-red-800 text-red-100 font-bold py-3 px-4 rounded font-mono border border-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'PROCESSING...' : 'REJECT PLAN'}
        </button>
      </div>
    </Card>
  );
}
