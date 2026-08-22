'use client';
import React from 'react';
import { KpiSummary } from '../components/dashboard/KpiSummary';
import { ActiveCasesList } from '../components/dashboard/ActiveCasesList';
import { usePolling, type DashboardSummary } from '../lib/api-client';

export default function DashboardPage() {
  const { data, isLoading, error } = usePolling<DashboardSummary>('/api/dashboard/summary', 5000);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 font-mono animate-pulse">Establishing Mission Control Link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-900 bg-red-950/20 p-6 rounded-lg text-center">
        <h2 className="text-red-500 font-bold font-mono mb-2">TELEMETRY LINK FAILED</h2>
        <p className="text-red-400 font-mono text-sm">{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 tracking-tight">NEXUS Operations</h1>
        <p className="text-gray-400 font-mono text-sm mt-1">Global Supply Chain Command Center</p>
      </header>

      <KpiSummary 
        coverageDays={data.kpis.coverageDays} 
        unitsAtRisk={data.kpis.unitsAtRisk} 
        emergencyBudget={data.kpis.emergencyBudget} 
      />
      
      <ActiveCasesList cases={data.activeCases} />
    </div>
  );
}
