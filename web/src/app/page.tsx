'use client';
import { usePolling, type DashboardSummary as DashboardSummaryType } from '../lib/api-client';
import { DashboardSummary } from '../components/dashboard/DashboardSummary';
import { IncidentGrid } from '../components/dashboard/IncidentGrid';
import { DynamicIsland } from '../components/island/DynamicIsland';
import { RecoveryTable } from '../components/dashboard/RecoveryTable';
import { Activity, ShieldCheck } from 'lucide-react';
import { useMission } from '../contexts/MissionContext';

export default function DashboardPage() {
  const { data, isLoading } = usePolling<DashboardSummaryType>('/api/dashboard/summary', 5000);
  const { scenario } = useMission();

  return (
    <>
      <DynamicIsland />
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50/50 p-6">
        <div className="max-w-7xl w-full mx-auto space-y-8">
          
          <header>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Factory Operations
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time supply chain monitoring and AI recovery</p>
          </header>

          <section>
            <DashboardSummary />
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Activity size={18} className="text-zinc-500" /> Active Incidents
              </h2>
            </div>
            
            <IncidentGrid 
              cases={scenario === 'HEALTHY' ? [] : data?.activeCases || []} 
              loading={isLoading} 
            />
            
            <RecoveryTable />
          </section>

        </div>
      </div>
    </>
  );
}