import React from 'react';
import { CheckCircle, Clock, Shield } from 'lucide-react';

export function IslandCompleted() {
  return (
    <div className="p-6 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
        <CheckCircle size={28} className="text-emerald-600" />
      </div>
      <div>
        <h3 className="font-bold text-zinc-900 text-lg">Production Restored</h3>
        <p className="text-sm text-zinc-500 mt-1">Recovery executed successfully</p>
      </div>
      <div className="w-full grid grid-cols-3 gap-3">
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
          <Clock size={14} className="text-zinc-400 mx-auto mb-1" />
          <p className="text-lg font-black text-emerald-600">0 hr</p>
          <p className="text-[10px] text-zinc-400">Downtime</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
          <Shield size={14} className="text-zinc-400 mx-auto mb-1" />
          <p className="text-lg font-black text-zinc-900">6.2</p>
          <p className="text-[10px] text-zinc-400">Days Coverage</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-center">
          <CheckCircle size={14} className="text-zinc-400 mx-auto mb-1" />
          <p className="text-lg font-black text-zinc-900">42</p>
          <p className="text-[10px] text-zinc-400">Orders Saved</p>
        </div>
      </div>
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 font-medium">
        Supplier B PO issued · ERP updated · Production on schedule
      </div>
    </div>
  );
}