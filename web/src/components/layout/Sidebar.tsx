'use client';
import React, { useState } from 'react';
import { LayoutDashboard, AlertTriangle, Building2, Truck, FileText, BarChart2, Clock, Settings, FlaskConical, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const OVERVIEW = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: AlertTriangle, label: 'Incidents', href: '/incidents' },
  { icon: BarChart2, label: 'Analytics', href: '/analytics' },
];
const OPERATIONS = [
  { icon: FileText, label: 'Orders', href: '/orders' },
  { icon: Truck, label: 'Shipments', href: '/shipments' },
  { icon: Building2, label: 'Suppliers', href: '/suppliers' },
];
const GOVERNANCE = [
  { icon: Clock, label: 'Audit', href: '/audit' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];
const SCENARIOS = [
  { icon: FlaskConical, label: 'Scenario Lab', href: '/scenarios' },
];

function NavGroup({ label, items, expanded, pathname }: { label: string; items: typeof OVERVIEW; expanded: boolean; pathname: string }) {
  return (
    <div className="mb-4">
      {expanded && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-1.5">{label}</p>}
      {!expanded && <div className="w-6 h-px bg-zinc-200 mx-auto mb-2.5" />}
      <div className="space-y-0.5">
        {items.map(({ icon: Icon, label: itemLabel, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={itemLabel}
              href={href}
              title={!expanded ? itemLabel : undefined}
              className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm relative
                ${active ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
              {expanded && <span className="truncate">{itemLabel}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();

  return (
    // The collapse toggle must sit half-outside the sidebar's right edge, but
    // the sidebar itself needs overflow-hidden so its content doesn't spill
    // during the width animation — those two requirements conflict on the
    // same element (a child positioned outside an overflow-hidden parent gets
    // clipped). This outer wrapper carries the layout sizing; overflow-hidden
    // only applies to the inner motion.div, so the button (a sibling) is never
    // clipped regardless of collapsed/expanded state.
    <div className="relative h-full shrink-0">
      <motion.div
        animate={{ width: expanded ? 208 : 64 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="relative bg-white border-r border-zinc-200 h-full flex flex-col overflow-hidden"
      >
        <div className="h-14 shrink-0" aria-hidden />

        <nav className="flex-1 px-2.5 py-2 overflow-y-auto overflow-x-hidden">
          <NavGroup label="Overview" items={OVERVIEW} expanded={expanded} pathname={pathname} />
          <NavGroup label="Operations" items={OPERATIONS} expanded={expanded} pathname={pathname} />
          <NavGroup label="Governance" items={GOVERNANCE} expanded={expanded} pathname={pathname} />
          <NavGroup label="Scenarios" items={SCENARIOS} expanded={expanded} pathname={pathname} />
        </nav>
      </motion.div>

      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute -right-3 top-5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-200 hover:text-zinc-700"
      >
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronRight size={13} />
        </motion.div>
      </button>
    </div>
  );
}
