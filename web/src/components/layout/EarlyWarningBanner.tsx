'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export function EarlyWarningBanner({ coverageDays }: { coverageDays: number }) {
  const [dismissed, setDismissed] = useState(false);
  const show = coverageDays < 5 && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="overflow-hidden bg-amber-50 border-b border-amber-200/90"
        >
          <div className="px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
              <span className="flex h-5 w-5 rounded-md bg-amber-200/60 items-center justify-center shrink-0">
                <AlertTriangle size={13} className="text-amber-700" />
              </span>
              <span>
                <strong className="font-bold text-amber-950 font-mono">
                  CRITICAL INVENTORY ALERT: {coverageDays.toFixed(1)} Days Coverage Remaining
                </strong>
                <span className="text-amber-800 ml-2 hidden sm:inline">
                  · Safety stock threshold breached. NEXUS autonomous monitoring active.
                </span>
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss early warning alert"
              className="cursor-pointer text-amber-700 hover:text-amber-950 hover:bg-amber-100/60 p-1 rounded-md transition-colors ml-4"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}