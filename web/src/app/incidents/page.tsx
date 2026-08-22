'use client';
import React, { useState } from 'react';
import { IncidentGrid } from '../../components/dashboard/IncidentGrid';
import { usePolling } from '../../lib/api-client';
import type { DashboardSummary } from '../../lib/api-client';
import { AlertTriangle, Filter, Search } from 'lucide-react';

export default function IncidentsPage() {
  const { data, isLoading } = usePolling<DashboardSummary>('/api/dashboard/summary', 10000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-8 py-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Active Incidents</h1>
              <p className="text-sm text-zinc-500 font-medium">All tracked supply chain disruptions requiring attention.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search incidents by ID, part, or supplier..." 
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex-1 p-2">
        {isLoading || !data ? (
          <div className="p-12 text-center text-zinc-400">Loading incidents...</div>
        ) : (
          <IncidentGrid 
            cases={data.activeCases} 
            selectedId={selectedId} 
            onSelect={(id) => setSelectedId(prev => prev === id ? null : id)} 
          />
        )}
      </div>
    </div>
  );
}