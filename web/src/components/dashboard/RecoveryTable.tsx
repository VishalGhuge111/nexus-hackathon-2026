'use client';
import React, { useState } from 'react';
import { ArrowRight, Plane, Truck, Anchor, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useMission } from '../../contexts/MissionContext';
import { bus } from '../../events/eventBus';

export function RecoveryTable() {
  const { scenario } = useMission();
  const [selected, setSelected] = useState<string | null>(null);

  if (scenario !== 'RECOVERY') return null;

  const options = [
    { id: 'opt1', supplier: 'Supplier B (Air Freight)', eta: '2 Days', cost: '+₹18.4k', risk: 'Low', icon: Plane, selected: true },
    { id: 'opt2', supplier: 'Supplier C (Express Rail)', eta: '4 Days', cost: '+₹6.2k', risk: 'Medium', icon: Truck, selected: false },
    { id: 'opt3', supplier: 'Supplier A (Sea Freight - Expedited)', eta: '9 Days', cost: '+₹1.1k', risk: 'High', icon: Anchor, selected: false },
  ];

  const handleSelect = (id: string) => {
    setSelected(id);
    // Micro feedback delay before updating Island
    setTimeout(() => {
      bus.publish('NEW_NOTIFICATION', {
        id: Date.now().toString(),
        title: 'Recovery Route Updated',
        message: 'New constraints simulated. Risk updated.',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      });
    }, 1000);
  };

  return (
    <div className="mt-8 bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
      <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <ShieldAlert className="text-blue-500" size={20} /> AI Recovery Options
          </h3>
          <p className="text-sm text-zinc-500 mt-1">Simulated alternatives to maintain production continuity</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-zinc-50 border-b border-zinc-100 uppercase">
            <tr>
              <th className="px-6 py-3">Route & Supplier</th>
              <th className="px-6 py-3">ETA</th>
              <th className="px-6 py-3">Cost Impact</th>
              <th className="px-6 py-3">Risk Assessment</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => (
              <tr 
                key={opt.id} 
                onClick={() => handleSelect(opt.id)}
                className={`border-b border-zinc-50 cursor-pointer transition-colors ${selected === opt.id || (!selected && opt.selected) ? 'bg-blue-50/50' : 'hover:bg-zinc-50'}`}
              >
                <td className="px-6 py-4 font-medium text-zinc-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <opt.icon size={14} className="text-zinc-600" />
                  </div>
                  {opt.supplier}
                </td>
                <td className="px-6 py-4 font-bold text-zinc-700">{opt.eta}</td>
                <td className="px-6 py-4 text-red-600 font-medium">{opt.cost}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${opt.risk === 'Low' ? 'bg-emerald-100 text-emerald-700' : opt.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {opt.risk}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {selected === opt.id || (!selected && opt.selected) ? (
                    <span className="inline-flex items-center gap-1 text-blue-600 font-bold">
                      <CheckCircle2 size={16} /> Selected
                    </span>
                  ) : (
                    <span className="text-zinc-400 font-medium hover:text-blue-600">Select</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}