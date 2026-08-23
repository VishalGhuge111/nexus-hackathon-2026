'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Truck, AlertTriangle, ShieldAlert, CheckCircle2, Search, ArrowUpRight } from 'lucide-react';
import { fetchOrders } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';

function ShipmentCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default function ShipmentsPage() {
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
        title="Shipments & Logistics"
        description="Physical delivery telemetry and transit statuses derived directly from real Purchase Order commitments."
        icon={<Truck size={18} className="text-blue-600" />}
      />

      {/* Search Filter */}
      <div className="bg-white border-b border-zinc-200/80 px-6 lg:px-8 py-3 shrink-0 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Shipment ID, SKU, Supplier, or Status..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50/80 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Showing {filteredOrders.length} of {orders?.length ?? 0} shipment(s)
        </span>
      </div>

      <div className="max-w-5xl w-full mx-auto p-6 lg:p-8 space-y-4 flex-1">
        {error ? (
          <ErrorState message={`Failed to load shipments: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : !orders ? (
          <>
            <ShipmentCardSkeleton />
            <ShipmentCardSkeleton />
            <ShipmentCardSkeleton />
          </>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
            {orders.length === 0 ? 'No shipment records exist yet.' : 'No shipments match your search filter.'}
          </div>
        ) : (
          filteredOrders.map((o) => {
            const isDelayed = o.status === 'DELAYED';
            return (
              <div
                key={o.id}
                className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs transition-all animate-fade-in select-none"
              >
                <div className="p-5 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${
                        isDelayed
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}
                    >
                      {isDelayed ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900 font-mono text-sm">{o.id}</h3>
                        <span className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60">
                          {o.supplierId}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Component: <strong className="text-zinc-800 font-medium">{o.sku}</strong> · Quantity:{' '}
                        <strong className="text-zinc-800 font-medium font-mono">{o.qty} units</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-0.5">
                        Target Delivery
                      </p>
                      <p className={`text-xs font-bold font-mono ${isDelayed ? 'text-red-600' : 'text-zinc-900'}`}>
                        {o.expectedDeliveryDate ? o.expectedDeliveryDate.slice(0, 10) : '—'}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isDelayed
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>

                {isDelayed && (
                  <div className="px-5 py-3 bg-red-50/40 border-t border-red-100 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-medium text-red-800">
                      Disruption detected: In-transit shipment failed SLA commitment.
                    </span>
                    {o.caseId ? (
                      <button
                        onClick={() => setOpenCaseId(o.caseId!)}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors shadow-2xs"
                      >
                        <ShieldAlert size={13} />
                        <span>Inspect Case ({o.caseId})</span>
                        <ArrowUpRight size={12} />
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400 font-mono">No case linked</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}