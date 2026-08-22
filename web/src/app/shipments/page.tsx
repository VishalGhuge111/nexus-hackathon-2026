import React from 'react';
import { Truck, MapPin, Box } from 'lucide-react';

const MOCK_SHIPMENTS = [
  { id: 'SHP-9921', origin: 'Supplier A (Frankfurt)', dest: 'Factory Alpha', status: 'In Transit', progress: 65, eta: 'Tomorrow 14:00' },
  { id: 'SHP-9922', origin: 'Supplier B (Mumbai)', dest: 'Factory Alpha', status: 'Delayed', progress: 30, eta: 'Pending' },
  { id: 'SHP-9923', origin: 'Local Warehouse', dest: 'Factory Beta', status: 'Delivered', progress: 100, eta: 'Today 09:00' },
];

export default function ShipmentsPage() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-8 py-6 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
            <Truck size={20} className="text-teal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Active Shipments</h1>
            <p className="text-sm text-zinc-500 font-medium">Real-time logistics tracking.</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 grid gap-4">
        {MOCK_SHIPMENTS.map(shp => (
          <div key={shp.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                <Box size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="font-mono font-bold text-zinc-900 mb-1">{shp.id}</p>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <MapPin size={14} /> {shp.origin} <span className="mx-2">→</span> {shp.dest}
                </div>
              </div>
            </div>
            
            <div className="w-64">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${shp.status === 'Delivered' ? 'text-emerald-600' : shp.status === 'Delayed' ? 'text-red-600' : 'text-blue-600'}`}>{shp.status}</span>
                <span className="text-xs text-zinc-500 font-medium">{shp.eta}</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${shp.status === 'Delivered' ? 'bg-emerald-500' : shp.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${shp.progress}%` }} />
              </div>
            </div>
            
            <button className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              Track Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}