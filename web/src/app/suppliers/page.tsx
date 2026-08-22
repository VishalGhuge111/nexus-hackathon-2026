'use client';
import React from 'react';
import { Building2, Filter, Shield, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';

const MOCK_SUPPLIERS = [
  { id: 'SUP-001', name: 'Supplier A', tier: 'Tier 1', risk: 'Low', reliability: 98, leadTime: '2-4 Days', region: 'North America' },
  { id: 'SUP-002', name: 'Supplier B', tier: 'Tier 1', risk: 'Low', reliability: 95, leadTime: '3-5 Days', region: 'Europe' },
  { id: 'SUP-003', name: 'Supplier C', tier: 'Tier 2', risk: 'High', reliability: 72, leadTime: '7-14 Days', region: 'Asia Pacific' },
  { id: 'SUP-004', name: 'Supplier D', tier: 'Tier 1', risk: 'Medium', reliability: 88, leadTime: '5-7 Days', region: 'North America' },
  { id: 'SUP-005', name: 'Supplier E', tier: 'Tier 3', risk: 'Low', reliability: 94, leadTime: '1-2 Days', region: 'Local' },
];

export default function SuppliersPage() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Supplier Network"
        description="Manage and monitor supplier risk and reliability metrics."
        icon={<Building2 size={20} className="text-blue-500" />}
        showBack={true}
        actions={
          <>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50 shadow-sm">
              <Filter size={16} /> Filter
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 shadow-sm">
              Add Supplier
            </button>
          </>
        }
      />
      
      <div className="p-8">
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Risk Profile</th>
                <th className="px-6 py-4">Reliability</th>
                <th className="px-6 py-4">Avg Lead Time</th>
                <th className="px-6 py-4">Region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {MOCK_SUPPLIERS.map(sup => (
                <tr key={sup.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-900">{sup.name}</p>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{sup.id}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-600">{sup.tier}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider
                      ${sup.risk === 'Low' ? 'bg-emerald-50 text-emerald-700' : 
                        sup.risk === 'High' ? 'bg-red-50 text-red-700' : 
                        'bg-amber-50 text-amber-700'}`}>
                      {sup.risk === 'Low' ? <Shield size={12} /> : <AlertTriangle size={12} />}
                      {sup.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 max-w-[60px]">
                        <div className={`h-1.5 rounded-full ${sup.reliability > 90 ? 'bg-emerald-500' : sup.reliability > 80 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${sup.reliability}%` }} />
                      </div>
                      <span className="font-bold tabular-nums text-zinc-700">{sup.reliability}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{sup.leadTime}</td>
                  <td className="px-6 py-4 text-zinc-600">{sup.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}