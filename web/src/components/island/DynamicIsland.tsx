'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Case } from '../../../../shared/types';
import { usePolling, type CaseDetail } from '../../lib/api-client';
import { IslandIdle } from './IslandIdle';
import { IslandInvestigating } from './IslandInvestigating';
import { IslandRecovery } from './IslandRecovery';
import { IslandCompleted } from './IslandCompleted';
import { Zap } from 'lucide-react';

const INVESTIGATING_STATUSES = ['OPEN', 'MONITORING', 'EARLY_RISK_CHECK', 'VERIFY'];
const RECOVERY_STATUSES = ['PLAN', 'VALIDATE', 'EXECUTE_OR_ESCALATE', 'HUMAN_ESCALATED_AWAITING_DECISION', 'ADAPT_REPLAN', 'NO_FEASIBLE_RECOVERY'];

function IslandContent({ caseId, onResolved }: { caseId: string; onResolved: () => void }) {
  const { data, isLoading } = usePolling<CaseDetail>(`/api/cases/${caseId}`, 4000);

  if (isLoading || !data) {
    return (
      <div className="p-6 flex items-center justify-center h-48">
        <div className="text-center text-zinc-400">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading case...</p>
        </div>
      </div>
    );
  }

  const { caseRecord } = data;
  const status = caseRecord.status;

  if (status === 'GOAL_ACHIEVED') return <IslandCompleted />;
  if (RECOVERY_STATUSES.includes(status)) {
    return <IslandRecovery detail={data} onResolved={onResolved} needsApproval={status === 'HUMAN_ESCALATED_AWAITING_DECISION'} />;
  }
  return <IslandInvestigating detail={data} />;
}

export function DynamicIsland({ selectedCaseId, onResolved }: { selectedCaseId: string | null; onResolved: () => void }) {
  return (
    <div className="w-80 xl:w-96 shrink-0 bg-white border-l border-zinc-200 h-full overflow-y-auto flex flex-col">
      <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-3 flex items-center gap-2 z-10">
        <Zap size={15} className="text-blue-500" />
        <h2 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">AI Command Center</h2>
        <div className={`ml-auto w-2 h-2 rounded-full ${selectedCaseId ? 'bg-blue-500 animate-pulse' : 'bg-emerald-400'}`} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCaseId || 'idle'}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="flex-1"
        >
          {selectedCaseId
            ? <IslandContent caseId={selectedCaseId} onResolved={onResolved} />
            : <IslandIdle />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}