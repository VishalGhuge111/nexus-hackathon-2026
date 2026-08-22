'use client';
import React, { useState } from 'react';
import { Bell, ChevronDown, Factory, AlertTriangle, CheckCircle } from 'lucide-react';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

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

          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <Bell size={18} className="text-zinc-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            OC
          </div>
        </div>
      </header>
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}