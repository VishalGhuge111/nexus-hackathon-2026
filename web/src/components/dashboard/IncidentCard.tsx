'use client';
import React from 'react';
import { motion } from 'framer-motion';
import type { Case } from '../../../../shared/types';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  MONITORING: { label: 'Monitoring', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  OPEN: { label: 'Monitoring', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  EARLY_RISK_CHECK: { label: 'Early Warning', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  VERIFY: { label: 'Investigating', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  PLAN: { label: 'Planning Recovery', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  VALIDATE: { label: 'Validating', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  EXECUTE_OR_ESCALATE: { label: 'Executing', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  HUMAN_ESCALATED_AWAITING_DECISION: { label: 'Approval Required', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  ADAPT_REPLAN: { label: 'Replanning', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  GOAL_ACHIEVED: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  NO_FEASIBLE_RECOVERY: { label: 'Escalated', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const PART_MAP: Record<string, string> = {
  'CASE-001': 'Hydraulic Valve', 'CASE-002': 'Bearing Assembly', 'CASE-003': 'Bearing Assembly'
};
const SUPPLIER_MAP: Record<string, string> = {
  'CASE-001': 'Supplier A', 'CASE-002': 'Supplier C', 'CASE-003': 'Supplier B'
};
const ACTION_MAP: Record<string, string> = {
  MONITORING: 'No action needed', EARLY_RISK_CHECK: 'Contact backup supplier', HUMAN_ESCALATED_AWAITING_DECISION: 'Switch to Supplier B'
};

interface IncidentCardProps { case_: Case; selected: boolean; onClick: () => void; index: number; }

export function IncidentCard({ case_: c, selected, onClick, index }: IncidentCardProps) {
  const status = STATUS_MAP[c.status] || STATUS_MAP['MONITORING'];
  const isCritical = c.priority === 'CRITICAL';
  const coverageDays = c.status === 'MONITORING' ? 4.8 : c.status === 'EARLY_RISK_CHECK' ? 2.3 : 2.1;
  const part = PART_MAP[c.id] || 'Component';
  const supplier = SUPPLIER_MAP[c.id] || 'Supplier';
  const action = ACTION_MAP[c.status] || 'Review incident';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      whileHover={{ scale: 1.015, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      onClick={onClick}
      className={`bg-white rounded-lg border-2 p-5 cursor-pointer transition-colors select-none
        ${selected ? 'border-blue-500 shadow-md shadow-blue-100' : 'border-zinc-200 hover:border-zinc-300'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-mono text-xs text-zinc-400">{c.id}</p>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{c.productionOrderId}</p>
        </div>
        <motion.span
          className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wide ${status.bg} ${status.color}`}
          animate={isCritical ? { scale: [1, 1.04, 1] } : {}}
          transition={isCritical ? { repeat: Infinity, duration: 1.5 } : {}}
        >
          {status.label}
        </motion.span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-0.5">Coverage Remaining</p>
        <p className={`text-4xl font-black tabular-nums ${coverageDays < 3 ? 'text-red-600' : coverageDays < 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
          {coverageDays.toFixed(1)} <span className="text-lg font-bold">Days</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Part</p>
          <p className="font-medium text-zinc-800">{part}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Supplier</p>
          <p className="font-medium text-zinc-800">{supplier}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Risk</p>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full ${i <= (isCritical ? 5 : c.status === 'EARLY_RISK_CHECK' ? 3 : 1) ? (isCritical ? 'bg-red-500' : 'bg-amber-400') : 'bg-zinc-200'}`} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">Replan Count</p>
          <p className="font-medium text-zinc-800">{c.replanCount}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Recommended Action</p>
          <p className="text-xs font-semibold text-zinc-700 mt-0.5">{action}</p>
        </div>
        <span className={`text-xs font-bold ${selected ? 'text-blue-600' : 'text-zinc-400'}`}>
          {selected ? 'Viewing →' : 'Review →'}
        </span>
      </div>
    </motion.div>
  );
}