import React from 'react';
import { CheckCircle, Building2, Truck } from 'lucide-react';

export function IslandIdle() {
  return (
    <div className="p-6 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
        <CheckCircle size={24} className="text-emerald-600" />
      </div>
      <div>
        <h3 className="font-bold text-zinc-900 text-lg">Production Protected</h3>
        <p className="text-sm text-zinc-500 mt-1">All systems operating normally</p>
      </div>
      <div className="w-full grid grid-cols-2 gap-3 mt-2">
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
          <Building2 size={16} className="text-zinc-400 mx-auto mb-1" />
          <p className="text-xl font-black text-zinc-900">128</p>
          <p className="text-xs text-zinc-400">Suppliers</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
          <Truck size={16} className="text-zinc-400 mx-auto mb-1" />
          <p className="text-xl font-black text-zinc-900">24</p>
          <p className="text-xs text-zinc-400">Shipments</p>
        </div>
      </div>
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 font-medium">
        Select an incident card to see AI activity
      </div>
    </div>
  );
}