'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { FileText, ShieldAlert, Loader2 } from 'lucide-react';
import { fetchOrders } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-600',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  DELAYED: 'bg-red-100 text-red-700',
  FULFILLED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-zinc-100 text-zinc-500'
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOrders()
      .then((data) => { if (!cancelled) setOrders(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative">
      <PageHeader
        title="Purchase Orders"
        description="Real purchase-order records from the current Store, including recovery allocations NEXUS created."
        icon={<FileText size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load orders: {error}
            </div>
          )}

          {!orders && !error ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-zinc-400">
              <Loader2 size={16} className="animate-spin" /> Loading orders…
            </div>
          ) : orders && orders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center text-sm text-zinc-500">
              No purchase orders yet.
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">SKU &amp; Supplier</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Expected Delivery</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Case</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(orders ?? []).map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-900">{o.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900">{o.sku}</div>
                        <div className="text-xs font-mono text-zinc-500">{o.supplierId}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700 font-mono">{o.qty}</td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">₹{(o.qty * o.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-zinc-500 font-mono">{o.expectedDeliveryDate.slice(0, 10)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[o.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {o.caseId ? (
                          <button
                            onClick={() => setOpenCaseId(o.caseId!)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wider"
                          >
                            <ShieldAlert size={13} /> {o.caseId}
                          </button>
                        ) : (
                          <span className="text-zinc-300 text-xs">No data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}
