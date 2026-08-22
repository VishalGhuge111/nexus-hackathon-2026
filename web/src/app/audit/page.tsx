'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Activity, Download, Search, CheckCircle, ShieldAlert } from 'lucide-react';
import { useMission } from '../../contexts/MissionContext';
import { toast } from 'sonner';

export default function AuditPage() {
  const { auditLogs } = useMission();
  const [isExporting, setIsExporting] = useState(false);

  const mockLogs = [
    { id: 1, time: '10:45:00', action: 'Recovery Plan Approved', user: 'Admin', severity: 'info' },
    { id: 2, time: '10:42:12', action: 'Supplier B Selected', user: 'System', severity: 'info' },
    { id: 3, time: '10:41:05', action: 'Alternative Routes Calculated', user: 'AI Engine', severity: 'info' },
    { id: 4, time: '10:40:00', action: 'Critical Delay Detected: SHP-991', user: 'Telemetry', severity: 'high' },
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Simulate file download trigger
      const element = document.createElement("a");
      const file = new Blob(["id,time,action,user,severity\n1,10:45:00,Recovery Plan Approved,Admin,info\n"], {type: 'text/csv'});
      element.href = URL.createObjectURL(file);
      element.download = `NEXUS_Audit_2026-08-22.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setIsExporting(false);
      toast.success('Audit Log Exported', { description: 'NEXUS_Audit_2026-08-22.csv downloaded to your device.' });
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50">
      <PageHeader 
        title="Audit Trail" 
        description="Immutable log of system actions and AI decisions"
        icon={<Activity size={20} className="text-blue-600" />}
        actions={
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 disabled:opacity-70"
          >
            {isExporting ? 'Exporting...' : <><Download size={16} /> Export CSV</>}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter logs..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-6">
              <div className="relative border-l-2 border-zinc-100 ml-3 space-y-8">
                {mockLogs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${log.severity === 'high' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{log.action}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Executed by <span className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">{log.user}</span></p>
                      </div>
                      <div className="text-xs font-mono text-zinc-400 mt-2 sm:mt-0">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}