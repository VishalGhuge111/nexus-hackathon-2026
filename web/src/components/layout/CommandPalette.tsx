'use client';
import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShieldAlert,
  Truck,
  Factory,
  User,
  Settings,
  X,
  BarChart2,
  Clock,
  FlaskConical,
  PlayCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { triggerShipmentDelay } from '../../lib/api-client';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-zinc-900/40 backdrop-blur-xs animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="w-full h-full flex flex-col"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <div className="flex items-center border-b border-zinc-100 px-3.5 py-2.5">
            <Search className="w-4.5 h-4.5 text-zinc-400 shrink-0 mx-2" />
            <Command.Input
              autoFocus
              placeholder="Search or jump to... (Actions, Cases, Routes)"
              className="flex-1 h-10 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-sm font-medium"
            />
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-thin">
            <Command.Empty className="py-8 text-center text-zinc-500 text-sm">
              No matching actions or pages found.
            </Command.Empty>

            <Command.Group heading="Simulation Actions" className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 mt-1">
              <Command.Item
                onSelect={async () => {
                  try {
                    await triggerShipmentDelay(24);
                    router.push('/incidents');
                  } catch (e) {
                    console.error(e);
                  }
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-blue-50 text-zinc-800 hover:text-blue-700 transition-colors group mt-0.5"
              >
                <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200">
                  <PlayCircle size={15} />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 group-hover:text-blue-800">Simulate Shipment Delay (24h)</div>
                  <div className="text-xs text-zinc-400 group-hover:text-blue-600">Triggers real disruption on COMP-ALPHA</div>
                </div>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigation" className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 mt-3">
              <Command.Item
                onSelect={() => { router.push('/'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <Factory size={15} className="text-zinc-400" />
                <span className="font-medium">Dashboard Overview</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/incidents'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <ShieldAlert size={15} className="text-zinc-400" />
                <span className="font-medium">Active Incidents</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/scenarios'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <FlaskConical size={15} className="text-zinc-400" />
                <span className="font-medium">Scenario Simulation Lab</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/analytics'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <BarChart2 size={15} className="text-zinc-400" />
                <span className="font-medium">Operations Analytics</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/orders'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <FileText size={15} className="text-zinc-400" />
                <span className="font-medium">Purchase Orders</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/shipments'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <Truck size={15} className="text-zinc-400" />
                <span className="font-medium">Shipments & Deliveries</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/suppliers'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <User size={15} className="text-zinc-400" />
                <span className="font-medium">Supplier Network</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/audit'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <Clock size={15} className="text-zinc-400" />
                <span className="font-medium">Immutable Audit Trail</span>
              </Command.Item>
              <Command.Item
                onSelect={() => { router.push('/settings'); setOpen(false); }}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 text-zinc-700 transition-colors"
              >
                <Settings size={15} className="text-zinc-400" />
                <span className="font-medium">System Configuration</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}