import React, { useState } from 'react';
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
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top-10 fade-in duration-500">
      <div className="bg-popover/80 backdrop-blur-2xl border border-primary/50 rounded-2xl p-6 shadow-[0_0_40px_rgba(249,115,22,0.15)] flex flex-col gap-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-primary/30">
            Action Required
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Human Approval Required</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md">
            The Agent has validated a recovery plan that exceeds automated approval thresholds. 
            Ops Controller authorization is required.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-3 mt-2">
          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={loading}
            className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground font-bold py-3 px-4 rounded-xl border border-destructive/30 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            {loading ? 'Processing...' : 'Reject Plan'}
          </button>
          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={loading}
            className="flex-[2] bg-gradient-to-br from-primary to-primary/80 hover:to-primary text-primary-foreground font-black py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            {loading ? 'Processing...' : 'Authorize Execution'}
          </button>
        </div>
      </div>
    </div>
  );
}
