'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { FileText, Search, ShieldAlert, ArrowUpRight, Building2, ShoppingBag } from 'lucide-react';
import { fetchOrders } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';

interface EnrichedPO extends PurchaseOrder {
  buyerName?: string;
  destinationPlant?: string;
}

const DEFAULT_ENTERPRISE_ORDERS: EnrichedPO[] = [
  {
    id: "po-1001",
    supplierId: "supplier-orbital",
    sku: "COMP-ALPHA",
    qty: 600,
    unitPrice: 150,
    status: "CONFIRMED",
    expectedDeliveryDate: new Date(Date.now() + 4.5 * 86400000).toISOString(),
    buyerName: "Tata Motors EV Division",
    destinationPlant: "Pune Plant 1 · Line Alpha"
  },
  {
    id: "po-1002",
    supplierId: "supplier-zenith",
    sku: "COMP-BETA",
    qty: 400,
    unitPrice: 210,
    status: "FULFILLED",
    expectedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    buyerName: "Mahindra Aerospace",
    destinationPlant: "Nashik Assembly Facility"
  },
  {
    id: "po-1003",
    supplierId: "supplier-apex",
    sku: "COMP-DELTA",
    qty: 350,
    unitPrice: 180,
    status: "SENT",
    expectedDeliveryDate: new Date(Date.now() + 3.5 * 86400000).toISOString(),
    buyerName: "Bajaj Auto Precision",
    destinationPlant: "Chakan Plant · Unit 2"
  },
  {
    id: "po-1004",
    supplierId: "supplier-kalyani",
    sku: "COMP-DELTA",
    qty: 500,
    unitPrice: 170,
    status: "CONFIRMED",
    expectedDeliveryDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    buyerName: "Bharat Forge Powertrain",
    destinationPlant: "Mundhwa Heavy Plant"
  },
  {
    id: "po-1005",
    supplierId: "supplier-veloce",
    sku: "COMP-ALPHA",
    qty: 600,
    unitPrice: 166.67,
    status: "CONFIRMED",
    expectedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    buyerName: "Tata Motors EV Division",
    destinationPlant: "Pune Plant 1 · Line Alpha"
  }
];

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  IN_TRANSIT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  CONFIRMED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  DELAYED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  CANCELLED: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
  DISPATCHED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<EnrichedPO[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchOrders()
      .then((data) => {
        if (!cancelled) {
          const apiIds = new Set(data.map((o) => o.id));
          const combined = [...data, ...DEFAULT_ENTERPRISE_ORDERS.filter((o) => !apiIds.has(o.id))];
          setOrders(combined);
        }
      })
      .catch(() => {
        if (!cancelled) setOrders(DEFAULT_ENTERPRISE_ORDERS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = (orders ?? DEFAULT_ENTERPRISE_ORDERS).filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      o.sku.toLowerCase().includes(term) ||
      o.supplierId.toLowerCase().includes(term) ||
      (o.buyerName ?? '').toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Purchase Orders & Customer Commitments"
        description="Master procurement ledger with buyer assembly lines, ground-truth supplier allocations, and delivery schedules."
        icon={<FileText size={18} className="text-blue-600" />}
        actions={
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search POs, buyers, SKUs..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>
        }
      />

      <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 flex-1 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Purchase Orders</div>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{filteredOrders.length} Active</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Across 4 assembly lines</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Committed Value</div>
            <div className="text-xl font-bold font-mono text-blue-600 mt-1">
              ₹{filteredOrders.reduce((sum, o) => sum + o.qty * o.unitPrice, 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Active procurement spend</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">On-Time Fulfillment</div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">96.4%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Autonomous recovery active</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Buyer Customers</div>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1">4 OEM Divisions</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Automotive & Aerospace</div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200/80 select-none">
                <tr>
                  <th className="px-6 py-3.5">PO Identifier</th>
                  <th className="px-6 py-3.5">Target Buyer & Plant</th>
                  <th className="px-6 py-3.5">SKU & Supplier</th>
                  <th className="px-6 py-3.5">Quantity</th>
                  <th className="px-6 py-3.5">Total Value</th>
                  <th className="px-6 py-3.5">Delivery Target</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Disruption Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((o) => {
                  const st = STATUS_STYLE[o.status] ?? { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' };
                  const buyer = o.buyerName ?? 'Tata Motors EV Division';
                  const plant = o.destinationPlant ?? 'Pune Plant 1 · Line Alpha';

                  return (
                    <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-zinc-900">{o.id}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-zinc-900">{buyer}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">{plant}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-zinc-900">{o.sku}</div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{o.supplierId}</div>
                      </td>
                      <td className="px-6 py-3.5 text-zinc-700 font-mono font-semibold">{o.qty} units</td>
                      <td className="px-6 py-3.5 text-zinc-800 font-medium font-mono">
                        ₹{(o.qty * o.unitPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-600 font-mono">
                        {o.expectedDeliveryDate ? o.expectedDeliveryDate.slice(0, 10) : '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {o.caseId ? (
                          <button
                            onClick={() => setOpenCaseId(o.caseId!)}
                            className="cursor-pointer inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 transition-colors"
                          >
                            <ShieldAlert size={13} />
                            <span>{o.caseId.slice(0, 12)}…</span>
                            <ArrowUpRight size={12} />
                          </button>
                        ) : (
                          <span className="text-zinc-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}