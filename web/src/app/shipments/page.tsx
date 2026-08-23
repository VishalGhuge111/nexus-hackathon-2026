'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Truck, ShieldAlert, Package } from 'lucide-react';
import { fetchOrders, fetchSuppliers, fetchAllAuditEvents, PRODUCTION_ORDER_ID } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';
import type { Supplier } from '@nexus/shared/types/supplier';
import type { AuditEvent } from '@nexus/shared/types/audit';

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-zinc-100 text-zinc-600',
  SENT: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  DELAYED: 'bg-red-100 text-red-700',
  FULFILLED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-zinc-100 text-zinc-500'
};

const RISK_STYLE: Record<string, string> = {
  'At risk': 'bg-red-100 text-red-700',
  'On track': 'bg-zinc-100 text-zinc-600',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-zinc-100 text-zinc-400'
};

function riskLabel(status: PurchaseOrder['status']): keyof typeof RISK_STYLE {
  if (status === 'DELAYED') return 'At risk';
  if (status === 'FULFILLED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'On track';
}

function ShipmentsTableSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
          <tr>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Shipment / PO</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Buyer / Destination</th>
            <th className="px-6 py-4">Component</th>
            <th className="px-6 py-4">Qty</th>
            <th className="px-6 py-4">ETA</th>
            <th className="px-6 py-4">Risk</th>
            <th className="px-6 py-4">Last Update</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {[1, 2, 3].map((i) => (
            <tr key={i}>
              {Array.from({ length: 9 }).map((_, j) => (
                <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([fetchOrders(), fetchSuppliers(), fetchAllAuditEvents()])
      .then(([o, s, a]) => {
        if (cancelled) return;
        setOrders(o);
        setSuppliers(s);
        setAuditEvents(a);
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const supplierNameById = useMemo(() => {
    const map = new Map<string, string>();
    (suppliers ?? []).forEach((s) => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  // Last-update-per-case: the real timestamp of the most recent audit event
  // touching that shipment's case. PurchaseOrder has no updatedAt field
  // (shared/types/procurement.ts) so this is the honest real-data substitute
  // rather than an invented value.
  const lastUpdateByCaseId = useMemo(() => {
    const map = new Map<string, string>();
    for (const evt of auditEvents ?? []) {
      const current = map.get(evt.caseId);
      if (!current || new Date(evt.timestamp).getTime() > new Date(current).getTime()) {
        map.set(evt.caseId, evt.timestamp);
      }
    }
    return map;
  }, [auditEvents]);

  const stats = useMemo(() => {
    const list = orders ?? [];
    return {
      active: list.filter((o) => o.status === 'SENT' || o.status === 'CONFIRMED' || o.status === 'DRAFT').length,
      atRisk: list.filter((o) => o.status === 'DELAYED').length,
      delayed: list.filter((o) => o.status === 'DELAYED').length,
      delivered: list.filter((o) => o.status === 'FULFILLED').length
    };
  }, [orders]);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative">
      <PageHeader
        title="Shipments"
        description="Monitor inbound and outbound supply commitments across suppliers and production sites."
        icon={<Truck size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Active Shipments" value={orders ? stats.active : null} icon={<Truck className="h-4 w-4" />} status="ok" />
            <KpiCard label="At Risk" value={orders ? stats.atRisk : null} icon={<ShieldAlert className="h-4 w-4" />} status={stats.atRisk > 0 ? 'critical' : 'ok'} />
            <KpiCard label="Delayed" value={orders ? stats.delayed : null} icon={<ShieldAlert className="h-4 w-4" />} status={stats.delayed > 0 ? 'warn' : 'ok'} />
            <KpiCard label="Delivered" value={orders ? stats.delivered : null} icon={<Package className="h-4 w-4" />} status="ok" />
          </div>

          {/* Honest scope note: the domain model (shared/types/production.ts) has
              exactly one ProductionOrder/site in this dataset. A supplier ->
              multiple-buyers view isn't something real data can show yet; the
              buyer-receiving-from-multiple-suppliers relationship below (Orbital
              Components Ltd + Veloce Parts Co, both against the same buyer) is
              real, derived from actual PurchaseOrder + Supplier records. */}
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500">
            All shipments below feed a single real production order (<span className="font-mono">{PRODUCTION_ORDER_ID}</span>). The dataset does not yet model multiple buyer/destination sites, so a supplier-to-multiple-buyers view isn&apos;t shown &mdash; only what real data supports.
          </div>

          {error ? (
            <ErrorState message={`Failed to load shipments: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
          ) : !orders ? (
            <ShipmentsTableSkeleton />
          ) : orders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center text-sm text-zinc-500">
              No shipments yet.
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto shadow-sm animate-fade-in">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Shipment / PO</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Buyer / Destination</th>
                    <th className="px-6 py-4">Component</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">ETA</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((o) => {
                    const lastUpdate = o.caseId ? lastUpdateByCaseId.get(o.caseId) : undefined;
                    const risk = riskLabel(o.status);
                    return (
                      <tr
                        key={o.id}
                        className={`transition-colors ${o.caseId ? 'cursor-pointer hover:bg-zinc-50' : ''}`}
                        onClick={() => o.caseId && setOpenCaseId(o.caseId)}
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[o.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-zinc-900">{o.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900">{supplierNameById.get(o.supplierId) ?? o.supplierId}</div>
                          <div className="text-xs font-mono text-zinc-400">{o.supplierId}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{PRODUCTION_ORDER_ID}</td>
                        <td className="px-6 py-4 text-zinc-700">{o.sku}</td>
                        <td className="px-6 py-4 text-zinc-700 font-mono">{o.qty}</td>
                        <td className="px-6 py-4 text-zinc-500 font-mono">{o.expectedDeliveryDate.slice(0, 10)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${RISK_STYLE[risk]}`}>{risk}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                          {lastUpdate ? new Date(lastUpdate).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'}
                        </td>
                      </tr>
                    );
                  })}
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
