'use client';
import React, { useEffect, useState } from 'react';
import { Clock, Download } from 'lucide-react';
import { AuditTimeline } from '../../components/island/AuditTimeline';
import { type CaseDetail, usePolling } from '../../lib/api-client';

export default function AuditPage() {
  const { data } = usePolling<CaseDetail>('/api/cases/CASE-002', 10000); // Mock pulling the critical case
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-8 py-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Audit & Replay</h1>
              <p className="text-sm text-zinc-500 font-medium">Historical logs and decision trails for compliance.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm font-bold text-zinc-700 hover:bg-zinc-50 shadow-sm">
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>
      
      <div className="p-8 max-w-3xl">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-2 pt-6">
          {isClient && data ? <AuditTimeline events={data.auditEvents} /> : <div className="p-12 text-center text-zinc-400">Loading audit trail...</div>}
        </div>
      </div>
    </div>
  );
}