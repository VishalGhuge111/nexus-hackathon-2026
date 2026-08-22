'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

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
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <span>
                <span className="font-bold">⚠ Inventory Coverage: {coverageDays.toFixed(1)} Days Remaining</span>
                <span className="text-amber-600 ml-2">· Alternative suppliers identified and prepared</span>
              </span>
            </div>
            <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700 ml-4">
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}