'use client';
import React from 'react';
import { FileText, Filter, MoreHorizontal, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';

const MOCK_ORDERS = [
  { id: 'PO-2026-X1', customer: 'Global Motors', items: 420, value: '₹24.5L', status: 'On Track', date: '2026-08-25' },
  { id: 'PO-2026-X2', customer: 'AeroTech Inc', items: 150, value: '₹8.2L', status: 'At Risk', date: '2026-08-23' },
  { id: 'PO-2026-X3', customer: 'MechCorp', items: 85, value: '₹3.1L', status: 'Delayed', date: '2026-08-22' },
  { id: 'PO-2026-X4', customer: 'Global Motors', items: 600, value: '₹35.0L', status: 'On Track', date: '2026-08-28' },
];

export default function OrdersPage() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="Production Orders"
        description="Manage and track customer order fulfillment."
        icon={<FileText size={20} className="text-indigo-500" />}
        showBack={true}
        actions={
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-50 shadow-sm">
            <Filter size={16} /> Filter
          </button>
        }
      />
      
      <div className="p-8">
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Target Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {MOCK_ORDERS.map(order => (
                <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-zinc-900">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-zinc-700">{order.customer}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {order.status === 'On Track' ? <CheckCircle size={14} className="text-emerald-500" /> : 
                       order.status === 'At Risk' ? <Clock size={14} className="text-amber-500" /> : 
                       <AlertCircle size={14} className="text-red-500" />}
                      <span className={`font-semibold ${order.status === 'On Track' ? 'text-emerald-700' : order.status === 'At Risk' ? 'text-amber-700' : 'text-red-700'}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-mono text-xs">{order.date}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{order.items}</td>
                  <td className="px-6 py-4 font-bold text-zinc-900">{order.value}</td>
                  <td className="px-6 py-4 text-right text-zinc-400 hover:text-zinc-700 cursor-pointer">
                    <MoreHorizontal size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}