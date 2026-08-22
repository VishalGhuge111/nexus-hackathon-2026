'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, XCircle } from 'lucide-react';

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col border-l border-zinc-200"
          >
            <div className="flex justify-between items-center px-4 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900">Notifications</h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1"><XCircle size={10} /> Critical</p>
                {[
                  { title: 'Shipment Delay — Bearing Assembly', time: '10:02' },
                  { title: 'Inventory coverage below 3-day threshold', time: '10:04' },
                ].map(n => (
                  <div key={n.title} className="p-3 bg-red-50 border border-red-100 rounded-md mb-2">
                    <p className="text-sm font-medium text-red-800">{n.title}</p>
                    <p className="text-xs text-red-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle size={10} /> Warnings</p>
                {[
                  { title: 'Supplier B response delayed by 2 hours', time: '10:06' },
                  { title: 'Demand spike detected — +18% forecast', time: '10:08' },
                ].map(n => (
                  <div key={n.title} className="p-3 bg-amber-50 border border-amber-100 rounded-md mb-2">
                    <p className="text-sm font-medium text-amber-800">{n.title}</p>
                    <p className="text-xs text-amber-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Info size={10} /> Info</p>
                {[
                  { title: 'RFQ generated for 3 backup suppliers', time: '10:05' },
                  { title: 'Approval completed — Supplier B selected', time: '10:10' },
                ].map(n => (
                  <div key={n.title} className="p-3 bg-blue-50 border border-blue-100 rounded-md mb-2">
                    <p className="text-sm font-medium text-blue-800">{n.title}</p>
                    <p className="text-xs text-blue-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}