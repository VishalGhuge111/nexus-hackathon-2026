'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { FileText, MoreHorizontal, Download, Eye, Truck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useMission } from '../../contexts/MissionContext';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { openMission } = useMission();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const mockOrders = [
    { id: 'ORD-7729', item: 'Bearing Assembly', supplier: 'Supplier B', amount: '₹14,500', status: 'At Risk', date: 'Oct 12, 2026' },
    { id: 'ORD-7730', item: 'Cooling Unit', supplier: 'Supplier A', amount: '₹8,200', status: 'Fulfilled', date: 'Oct 11, 2026' },
    { id: 'ORD-7731', item: 'Control Module', supplier: 'Supplier C', amount: '₹22,100', status: 'In Transit', date: 'Oct 10, 2026' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative" onClick={() => setActiveMenu(null)}>
      <PageHeader 
        title="Purchase Orders" 
        description="Monitor order fulfillment and risk status"
        icon={<FileText size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Item & Supplier</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {mockOrders.map(o => (
                  <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-zinc-900">{o.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{o.item}</div>
                      <div className="text-xs text-zinc-500">{o.supplier}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{o.amount}</td>
                    <td className="px-6 py-4 text-zinc-500">{o.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        o.status === 'Fulfilled' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === o.id ? null : o.id); }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {activeMenu === o.id && (
                        <div className="absolute right-6 top-10 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-10 py-1 animate-in zoom-in-95 duration-100">
                          <button onClick={() => toast.info('Opening document...')} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                            <Eye size={14} className="text-zinc-400" /> View Details
                          </button>
                          <button onClick={() => toast.info('Redirecting to shipments...')} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                            <Truck size={14} className="text-zinc-400" /> View Shipment
                          </button>
                          <div className="h-px bg-zinc-100 my-1"></div>
                          {o.status === 'At Risk' ? (
                            <button 
                              onClick={() => { openMission('CASE-003'); setActiveMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                            >
                              <ShieldAlert size={14} /> Generate Recovery Plan
                            </button>
                          ) : (
                            <button className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium">
                              <CheckCircle2 size={14} /> No Risk Detected
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}