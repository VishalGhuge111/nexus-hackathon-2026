'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Truck, MapPin, Navigation, Anchor, AlertTriangle, PlayCircle } from 'lucide-react';
import { useMission } from '../../contexts/MissionContext';

export default function ShipmentsPage() {
  const { openMission } = useMission();
  const [expanded, setExpanded] = useState<string | null>('SHP-991');

  const mockShipments = [
    { id: 'SHP-991', origin: 'Supplier B (Shenzhen)', destination: 'Factory Alpha (Berlin)', status: 'Delayed', eta: 'Unknown', risk: 'High', carrier: 'Global Air Freight' },
    { id: 'SHP-992', origin: 'Supplier A (Taiwan)', destination: 'Factory Beta (Munich)', status: 'In Transit', eta: 'Oct 14, 2026', risk: 'Low', carrier: 'Oceanic Lines' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative">
      <PageHeader 
        title="Global Shipments" 
        description="Live tracking and transit risk monitoring"
        icon={<Truck size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {mockShipments.map(s => (
            <div key={s.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm transition-all">
              {/* Header */}
              <div 
                className={`p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors ${expanded === s.id ? 'border-b border-zinc-100 bg-zinc-50/50' : ''}`}
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.risk === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {s.risk === 'High' ? <AlertTriangle size={18} /> : <Anchor size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                      {s.id} <span className="text-xs font-mono font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{s.carrier}</span>
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">{s.origin} <span className="text-zinc-300 mx-1">→</span> {s.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">ETA</p>
                    <p className={`text-sm font-bold ${s.risk === 'High' ? 'text-red-600' : 'text-zinc-900'}`}>{s.eta}</p>
                  </div>
                  <button className="text-blue-600 text-sm font-bold hover:underline">
                    {expanded === s.id ? 'Close Details' : 'Track Details'}
                  </button>
                </div>
              </div>

              {/* Expanded Timeline */}
              {expanded === s.id && (
                <div className="p-6 bg-zinc-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Map Mock */}
                    <div className="col-span-2 bg-zinc-200 rounded-lg h-64 border border-zinc-300 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                      <MapPin className="text-blue-600 absolute bottom-1/3 left-1/3 w-8 h-8 animate-bounce" />
                      {s.risk === 'High' && (
                        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-red-500/20 rounded-full animate-ping flex items-center justify-center">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                    </div>

                    {/* Vertical Timeline */}
                    <div className="relative">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-200"></div>
                      
                      <div className="relative flex gap-4 mb-6">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shrink-0 z-10 flex items-center justify-center"></div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">Departed Origin</p>
                          <p className="text-xs text-zinc-500">Oct 8, 09:00 AM</p>
                        </div>
                      </div>

                      <div className="relative flex gap-4 mb-6">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shrink-0 z-10 flex items-center justify-center"></div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">Customs Clearance (Export)</p>
                          <p className="text-xs text-zinc-500">Oct 9, 14:30 PM</p>
                        </div>
                      </div>

                      <div className="relative flex gap-4 mb-6">
                        <div className={`w-6 h-6 rounded-full border-4 border-white shrink-0 z-10 flex items-center justify-center ${s.risk === 'High' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
                        <div>
                          <p className={`text-sm font-bold ${s.risk === 'High' ? 'text-red-600' : 'text-blue-600'}`}>
                            {s.risk === 'High' ? 'Port Congestion Detected' : 'In Transit'}
                          </p>
                          <p className="text-xs text-zinc-500">Current Status</p>
                          
                          {s.risk === 'High' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); openMission('CASE-003'); }}
                              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                              <PlayCircle size={14} /> Open Mission Control
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 border-4 border-white shrink-0 z-10"></div>
                        <div>
                          <p className="text-sm font-medium text-zinc-400">Destination Arrival</p>
                          <p className="text-xs text-zinc-400">{s.eta}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}