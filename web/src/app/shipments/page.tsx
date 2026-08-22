'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Truck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { fetchOrders } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';

function ShipmentCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="space-y-2 text-right">
            <Skeleton className="h-3 w-24 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchOrders()
      .then((data) => { if (!cancelled) setOrders(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative">
      <PageHeader
        title="Shipments"
        description="Delivery status derived from the same real purchase-order records (the domain model has no separate shipment/carrier entity)."
        icon={<Truck size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {error ? (
            <ErrorState message={`Failed to load shipments: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : !orders ? (
            <>
              <ShipmentCardSkeleton />
              <ShipmentCardSkeleton />
              <ShipmentCardSkeleton />
            </>
          ) : orders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center text-sm text-zinc-500">
              No purchase orders yet.
            </div>
          ) : (
            (orders ?? []).map((o) => {
              const isDelayed = o.status === 'DELAYED';
              return (
                <div key={o.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                  <div className="p-5 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDelayed ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isDelayed ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                          {o.id}
                          <span className="text-xs font-mono font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{o.supplierId}</span>
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">SKU {o.sku} &middot; {o.qty} units</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Expected Delivery</p>
                        <p className={`text-sm font-bold ${isDelayed ? 'text-red-600' : 'text-zinc-900'}`}>{o.expectedDeliveryDate.slice(0, 10)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDelayed ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>

                  {isDelayed && (
                    <div className="px-5 pb-5 -mt-1">
                      {o.caseId ? (
                        <button
                          onClick={() => setOpenCaseId(o.caseId!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          <ShieldAlert size={14} /> Open case {o.caseId}
                        </button>
                      ) : (
                        <p className="text-xs text-zinc-400">No case linked to this delay yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}
