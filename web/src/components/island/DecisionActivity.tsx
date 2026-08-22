'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import type { AuditEvent } from '../../../../shared/types';

const LABEL_MAP: Record<string, string> = {
  'Inventory levels verified': 'Inventory sufficient for 2.1 days',
  'Called calculate_recovery_plan': 'Recovery plan calculated',
  'Transitioned to VALIDATE': 'Recovery options evaluated',
  'Validation passed': 'Recovery plan satisfies all constraints',
  'Escalating to human approval': 'Cost exceeds auto-approval — escalating to operator',
  'Shipment tracking went inactive': 'Shipment delay detected — 7 days',
  'Backup suppliers contacted': 'Backup suppliers contacted — 3 alternatives found',
  'Recovery plan generated': 'Supplier B identified as best recovery option',
};

function humanize(summary: string): string {
  for (const [k, v] of Object.entries(LABEL_MAP)) {
    if (summary.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return summary;
}

export function DecisionActivity({ events }: { events: AuditEvent[] }) {
  const shown = events.slice(-6);
  return (
    <div className="space-y-2">
      {shown.map((evt, i) => {
        const isLast = i === shown.length - 1;
        const isWarning = evt.type === 'STATE_TRANSITION' && evt.summary.toLowerCase().includes('escalat');
        const icon = isLast && isWarning
          ? <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          : isLast
          ? <Loader size={14} className="text-blue-400 shrink-0 mt-0.5 animate-spin" />
          : <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />;
        return (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.25 }}
            className="flex items-start gap-2"
          >
            {icon}
            <p className={`text-xs leading-relaxed ${isLast ? (isWarning ? 'text-amber-700 font-semibold' : 'text-blue-700 font-semibold') : 'text-zinc-600'}`}>
              {humanize(evt.summary)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}