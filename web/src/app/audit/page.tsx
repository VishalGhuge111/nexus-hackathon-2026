'use client';
import React, { useEffect, useState } from 'react';
import { Clock, Download } from 'lucide-react';
import { AuditTimeline } from '../../components/island/AuditTimeline';
import { type CaseDetail, usePolling } from '../../lib/api-client';
import { PageHeader } from '../../components/layout/PageHeader';

export default function AuditPage() {
  const { data } = usePolling<CaseDetail>('/api/cases/CASE-002', 10000);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Audit & Replay"
        description="Historical logs and decision trails for compliance."
        icon={<Clock size={20} className="text-amber-500" />}
        showBack={true}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm font-bold text-zinc-700 hover:bg-zinc-50 shadow-sm transition-colors">
            <Download size={16} /> Export Logs
          </button>
        }
      />
      
      <div className="p-8 max-w-3xl">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-2 pt-6">
          {isClient && data ? <AuditTimeline events={data.auditEvents} /> : <div className="p-12 text-center text-zinc-400">Loading audit trail...</div>}
        </div>
      </div>
    </div>
  );
}