'use client';
import React, { useState } from 'react';
import { LayoutDashboard, AlertTriangle, Building2, Truck, FileText, BarChart2, Clock, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const MISSION = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: AlertTriangle, label: 'Active Incidents' },
];
const OPERATIONS = [
  { icon: Building2, label: 'Suppliers' },
  { icon: FileText, label: 'Orders' },
  { icon: Truck, label: 'Shipments' },
];
const INSIGHTS = [
  { icon: BarChart2, label: 'Analytics' },
  { icon: Clock, label: 'Audit / Replay' },
];

function NavGroup({ label, items, expanded }: { label: string; items: typeof MISSION; expanded: boolean }) {
  return (
    <div className="mb-3">
      {expanded && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-1">{label}</p>}
      {!expanded && <div className="w-8 h-px bg-zinc-200 mx-auto mb-2" />}
      {items.map(({ icon: Icon, label: itemLabel, active }) => (
        <button
          key={itemLabel}
          title={!expanded ? itemLabel : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm relative
            ${active ? 'text-blue-600 bg-blue-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
        >
          {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />}
          <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
          {expanded && <span className="font-medium truncate">{itemLabel}</span>}
        </button>
      ))}
    </div>
  );
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      animate={{ width: expanded ? 200 : 56 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="bg-white border-r border-zinc-200 h-full flex flex-col shrink-0 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="p-3 hover:bg-zinc-100 transition-colors flex justify-end"
        title={expanded ? 'Collapse' : 'Expand'}
      >
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronRight size={16} className="text-zinc-400" />
        </motion.div>
      </button>

      <nav className="flex-1 px-2 py-1 overflow-y-auto overflow-x-hidden">
        <NavGroup label="Mission" items={MISSION} expanded={expanded} />
        <NavGroup label="Operations" items={OPERATIONS} expanded={expanded} />
        <NavGroup label="Insights" items={INSIGHTS} expanded={expanded} />
      </nav>

      <div className="px-2 pb-3 border-t border-zinc-100 pt-2">
        <button
          title={!expanded ? 'Settings' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-sm"
        >
          <Settings size={18} strokeWidth={2} className="shrink-0" />
          {expanded && <span className="font-medium">Settings</span>}
        </button>
      </div>
    </motion.div>
  );
}