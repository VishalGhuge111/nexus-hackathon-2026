'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { FileText, Search, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { fetchOrders } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  IN_TRANSIT: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DELAYED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  CANCELLED: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
  DISPATCHED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
};

function TableSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
      <div className="p-4 border-b border-zinc-100 bg-zinc-50/60">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filteredOrders = (orders ?? []).filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      o.sku.toLowerCase().includes(term) ||
      o.supplierId.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Purchase Orders"
        description="Master procurement ledger with ground-truth supplier allocations and delivery commitments."
        icon={<FileText size={18} className="text-blue-600" />}
      />

      {/* Search Filter Bar */}
      <div className="bg-white border-b border-zinc-200/80 px-6 lg:px-8 py-3 shrink-0 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by PO ID, SKU, Supplier, or Status..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50/80 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Showing {filteredOrders.length} of {orders?.length ?? 0} order(s)
        </span>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 flex-1">
        {error ? (
          <ErrorState message={`Failed to load orders: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : !orders ? (
          <TableSkeleton />
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
            {orders.length === 0 ? 'No purchase orders recorded yet.' : 'No orders match your search criteria.'}
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200/80 select-none">
                  <tr>
                    <th className="px-6 py-3.5">PO Identifier</th>
                    <th className="px-6 py-3.5">SKU & Supplier</th>
                    <th className="px-6 py-3.5">Quantity</th>
                    <th className="px-6 py-3.5">Total Value</th>
                    <th className="px-6 py-3.5">Delivery Target (UTC)</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Disruption Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.map((o) => {
                    const st = STATUS_STYLE[o.status] ?? { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' };
                    return (
                      <tr key={o.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-zinc-900">{o.id}</td>
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
                              <span>{o.caseId}</span>
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
        )}
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}