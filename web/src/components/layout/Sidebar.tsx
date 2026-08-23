'use client';
import React, { useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Building2,
  Truck,
  FileText,
  BarChart2,
  Clock,
  Settings,
  FlaskConical,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
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

function NavGroup({
  label,
  items,
  expanded,
  pathname
}: {
  label: string;
  items: typeof OVERVIEW;
  expanded: boolean;
  pathname: string;
}) {
  return (
    <div className="mb-4">
      {expanded && (
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-1.5 select-none">
          {label}
        </p>
      )}
      {!expanded && <div className="w-6 h-px bg-zinc-200/80 mx-auto mb-2.5" />}
      <div className="space-y-0.5">
        {items.map(({ icon: Icon, label: itemLabel, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={itemLabel}
              href={href}
              title={!expanded ? itemLabel : undefined}
              className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm relative group select-none
                ${
                  active
                    ? 'text-blue-700 bg-blue-50/80 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-md" />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2.3 : 1.8}
                className={`shrink-0 transition-transform group-hover:scale-105 ${
                  active ? 'text-blue-600' : 'text-zinc-400 group-hover:text-zinc-700'
                }`}
              />
              {expanded && <span className="truncate tracking-tight">{itemLabel}</span>}
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
    <div className="relative h-full shrink-0 z-30">
      <motion.aside
        animate={{ width: expanded ? 216 : 64 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="relative bg-white border-r border-zinc-200/80 h-full flex flex-col overflow-hidden select-none"
      >
        <div className="h-14 flex items-center px-4 border-b border-zinc-100 shrink-0 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            <ShieldCheck size={18} />
          </div>
          {expanded && (
            <div className="truncate">
              <span className="font-bold text-base text-zinc-900 tracking-tight">NEXUS</span>
              <span className="ml-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                OPS
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden scroll-thin">
          <NavGroup label="Overview" items={OVERVIEW} expanded={expanded} pathname={pathname} />
          <NavGroup label="Operations" items={OPERATIONS} expanded={expanded} pathname={pathname} />
          <NavGroup label="Governance" items={GOVERNANCE} expanded={expanded} pathname={pathname} />
          <NavGroup label="Simulation" items={SCENARIOS} expanded={expanded} pathname={pathname} />
        </nav>
      </motion.aside>

      {/* Visible circular collapse/expand toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute -right-3 top-4 z-40 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-zinc-300/80 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900 hover:scale-110 active:scale-95"
      >
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={13} strokeWidth={2.5} />
        </motion.div>
      </button>
    </div>
  );
}