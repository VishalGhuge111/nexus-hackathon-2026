import React from 'react';
import { LayoutDashboard, Truck, FileText, Settings, UserCircle, Package } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="w-16 md:w-20 bg-white border-r border-neutral-200 h-screen flex flex-col items-center py-6 shrink-0 sticky top-0">
      <div className="mb-8 text-neutral-900 bg-neutral-100 p-2 rounded-lg"><Package size={24} strokeWidth={2.5} /></div>
      <nav className="flex flex-col gap-6 w-full items-center">
        <button className="text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors relative"><LayoutDashboard size={22} strokeWidth={2} /><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neutral-900 rounded-r-full" /></button>
        <button className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors"><Truck size={22} strokeWidth={2} /></button>
        <button className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors"><FileText size={22} strokeWidth={2} /></button>
      </nav>
      <div className="mt-auto flex flex-col gap-6 items-center">
        <button className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-lg transition-colors"><Settings size={22} strokeWidth={2} /></button>
        <button className="text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 p-2 rounded-full transition-colors border border-neutral-200"><UserCircle size={22} strokeWidth={1.5} /></button>
      </div>
    </div>
  );
}
