'use client';
import React, { useState } from 'react';
import { KpiSummary } from '../components/dashboard/KpiSummary';
import { ActiveCasesList } from '../components/dashboard/ActiveCasesList';
import { Sidebar } from '../components/layout/Sidebar';
import { CaseDetailPanel } from '../components/case/CaseDetailPanel';
import { usePolling, type DashboardSummary } from '../lib/api-client';

export default function DashboardPage() {
  const { data, isLoading, error } = usePolling<DashboardSummary>('/api/dashboard/summary', 5000);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <p className="text-neutral-500 animate-pulse font-medium">Establishing Mission Control Link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <div className="border border-red-200 bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-red-600 font-bold mb-2">TELEMETRY LINK FAILED</h2>
          <p className="text-red-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col h-screen overflow-y-auto ${selectedCaseId ? 'hidden lg:flex' : 'flex'}`}>
          <header className="px-6 py-8">
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Orders</h1>
            <div className="flex items-center justify-between mt-4">
              <div className="relative w-96">
                <input 
                  type="text" 
                  placeholder="Search orders by ID, status..." 
                  className="w-full bg-white border border-neutral-200 rounded-md py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                />
              </div>
              <button className="p-2 border border-neutral-200 bg-white rounded-md hover:bg-neutral-50 transition-colors">
                {/* Filter Icon Placeholder */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              </button>
            </div>
          </header>

          <KpiSummary 
            coverageDays={data.kpis.coverageDays} 
            unitsAtRisk={data.kpis.unitsAtRisk} 
            emergencyBudget={data.kpis.emergencyBudget} 
          />
          
          <ActiveCasesList 
            cases={data.activeCases} 
            selectedCaseId={selectedCaseId} 
            onSelect={setSelectedCaseId} 
          />
        </div>

        {/* Right Side Panel */}
        {selectedCaseId && (
          <div className="w-full lg:w-[450px] xl:w-[500px] shrink-0 h-screen overflow-hidden">
            <CaseDetailPanel caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />
          </div>
        )}
      </div>
    </>
  );
}
