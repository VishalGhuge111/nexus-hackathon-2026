'use client';
import React, { useState } from 'react';
import { Bell, ChevronDown, Factory, AlertTriangle, CheckCircle, X, XCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col border-l border-zinc-200">
            <div className="flex justify-between items-center px-4 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-zinc-900">Notifications</h2>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Critical</p>
                {['Shipment Delay — Bearing Assembly', 'Inventory coverage below threshold'].map(t => (
                  <div key={t} className="p-3 bg-red-50 border border-red-100 rounded-md mb-2">
                    <p className="text-sm font-medium text-red-800">{t}</p>
                    <p className="text-xs text-red-400 mt-0.5">10:02</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Warnings</p>
                {['Supplier B response delayed 2 hours', 'Demand spike detected +18%'].map(t => (
                  <div key={t} className="p-3 bg-amber-50 border border-amber-100 rounded-md mb-2">
                    <p className="text-sm font-medium text-amber-800">{t}</p>
                    <p className="text-xs text-amber-400 mt-0.5">10:06</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Info</p>
                {['RFQ generated for 3 backup suppliers', 'Approval completed — Supplier B selected'].map(t => (
                  <div key={t} className="p-3 bg-blue-50 border border-blue-100 rounded-md mb-2">
                    <p className="text-sm font-medium text-blue-800">{t}</p>
                    <p className="text-xs text-blue-400 mt-0.5">10:09</p>
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

export function TopNav() {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-zinc-900 text-lg tracking-tight">
            <Factory size={20} className="text-blue-600" />
            NEXUS
          </div>
          <span className="text-zinc-300 text-lg">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-sm text-zinc-500">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="font-medium text-zinc-700">Active Incident</span>
            <span className="text-zinc-400">·</span>
            <span>Bearing Shipment Delay</span>
            <span className="text-zinc-400">·</span>
            <span className="text-red-600 font-semibold">2.1 Days Coverage Remaining</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
            <CheckCircle size={12} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">Monitoring Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-zinc-600 border border-zinc-200 rounded-md px-2.5 py-1.5 bg-white cursor-pointer hover:bg-zinc-50">
            <span className="font-medium">Factory Alpha</span>
            <ChevronDown size={14} className="text-zinc-400" />
          </div>
          <button onClick={() => setNotifOpen(true)} className="relative p-2 hover:bg-zinc-100 rounded-md transition-colors">
            <Bell size={18} className="text-zinc-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer">OC</div>
        </div>
      </header>
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}