'use client';
import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, ShieldAlert, Truck, Factory, User, Settings, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
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
          <div className="flex items-center border-b border-zinc-100 px-3 py-2">
            <Search className="w-5 h-5 text-zinc-400 shrink-0 mx-2" />
            <Command.Input 
              autoFocus
              placeholder="Search or jump to... (Actions, Cases, Routes)" 
              className="flex-1 h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
            />
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-zinc-100 text-zinc-400">
              <X size={16} />
            </button>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="p-8 text-center text-zinc-500 text-sm">No results found.</Command.Empty>

            <Command.Group heading="Navigate" className="px-2 text-xs font-semibold text-zinc-500 mb-2 mt-1">
              <Command.Item 
                onSelect={() => { router.push('/'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100 aria-selected:bg-zinc-100 mt-1"
              >
                <Factory size={16} className="text-zinc-400" /> Dashboard
              </Command.Item>
              <Command.Item 
                onSelect={() => { router.push('/incidents'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100 aria-selected:bg-zinc-100 mt-1"
              >
                <ShieldAlert size={16} className="text-zinc-400" /> Active Incidents
              </Command.Item>
              <Command.Item 
                onSelect={() => { router.push('/suppliers'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100 aria-selected:bg-zinc-100 mt-1"
              >
                <User size={16} className="text-zinc-400" /> Suppliers
              </Command.Item>
              <Command.Item 
                onSelect={() => { router.push('/shipments'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100 aria-selected:bg-zinc-100 mt-1"
              >
                <Truck size={16} className="text-zinc-400" /> Shipments
              </Command.Item>
              <Command.Item 
                onSelect={() => { router.push('/settings'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-zinc-100 aria-selected:bg-zinc-100 mt-1"
              >
                <Settings size={16} className="text-zinc-400" /> Settings
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}