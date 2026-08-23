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
  ChevronLeft,
  ChevronRight
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
  { icon: Clock, label: 'Audit Trail', href: '/audit' },
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
      {expanded ? (
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2 select-none">
          {label}
        </p>
      ) : (
        <div className="w-6 h-px bg-zinc-200 mx-auto mb-2.5" />
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const itemLabel = item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all select-none ${
                active
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.25 h-6 bg-blue-600 rounded-r-md" />
              )}
              <Icon
                size={18}
                strokeWidth={active ? 2.3 : 1.85}
                className={`shrink-0 transition-transform group-hover:scale-105 ${
                  active ? 'text-blue-600' : 'text-zinc-400 group-hover:text-zinc-800'
                }`}
              />
              {expanded && <span className="truncate tracking-tight leading-none">{itemLabel}</span>}

              {/* Floating Tooltip in collapsed mode */}
              {!expanded && (
                <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {itemLabel}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <div className="relative h-full shrink-0 z-30">
      <motion.aside
        animate={{ width: expanded ? 232 : 68 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative bg-white border-r border-zinc-200/80 h-full flex flex-col overflow-hidden select-none"
      >
        {/* Brand Header with Official Logo */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-100 shrink-0 gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/high-resolution-color-logo.png"
              alt="NEXUS Logo"
              className="w-8.5 h-8.5 rounded-lg object-contain shrink-0 shadow-2xs border border-zinc-200/60 bg-white p-0.5"
            />
            {expanded && (
              <div className="truncate leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[15px] text-zinc-900 tracking-tight">NEXUS</span>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase border border-blue-100/80">
                    OPS
                  </span>
                </div>
                <p className="text-[9.5px] font-medium text-zinc-400 truncate mt-0.5">
                  Autonomous Recovery. Zero-Trust Sourcing.
                </p>
              </div>
            )}
          </Link>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-3.5 overflow-y-auto overflow-x-hidden scroll-thin">
          <NavGroup label="Overview" items={OVERVIEW} expanded={expanded} pathname={pathname} />
          <NavGroup label="Operations" items={OPERATIONS} expanded={expanded} pathname={pathname} />
          <NavGroup label="Governance" items={GOVERNANCE} expanded={expanded} pathname={pathname} />
          <NavGroup label="Simulation" items={SCENARIOS} expanded={expanded} pathname={pathname} />
        </nav>

        {/* Footer Collapse Action */}
        <div className="p-2.5 border-t border-zinc-100 flex items-center justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? (
              <>
                <ChevronLeft size={16} />
                <span>Collapse Menu</span>
              </>
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>
      </motion.aside>
    </div>
  );
}