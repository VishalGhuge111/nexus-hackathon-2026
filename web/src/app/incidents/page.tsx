'use client';
import React, { useState } from 'react';
import { IncidentGrid } from '../../components/dashboard/IncidentGrid';
import { usePolling } from '../../lib/api-client';
import type { DashboardSummary } from '../../lib/api-client';
import { AlertTriangle, Filter, Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';

export default function IncidentsPage() {
  const { data, isLoading } = usePolling<DashboardSummary>('/api/dashboard/summary', 10000);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Active Incidents"
        description="All tracked supply chain disruptions requiring attention."
        icon={<AlertTriangle size={20} className="text-red-500" />}
        showBack={true}
        actions={
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50 shadow-sm">
            <Filter size={16} /> Filter
          </button>
        }
      />
      
      <div className="bg-white border-b border-zinc-200 px-8 py-3 shrink-0 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search incidents by ID, part, or supplier..." 
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
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