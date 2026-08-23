'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Truck, AlertTriangle, ShieldAlert, CheckCircle2, Search, ArrowUpRight, MapPin, Navigation } from 'lucide-react';
import { fetchOrders } from '../../lib/api-client';
import { CaseDetailOverlay } from '../../components/mission-control/CaseDetailOverlay';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { PurchaseOrder } from '@nexus/shared/types/procurement';

interface EnrichedShipment extends PurchaseOrder {
  carrier?: string;
  trackingNo?: string;
  routeOrigin?: string;
  routeDestination?: string;
}

const DEFAULT_ENTERPRISE_SHIPMENTS: EnrichedShipment[] = [
  {
    id: "po-1001",
    supplierId: "supplier-orbital",
    sku: "COMP-ALPHA",
    qty: 600,
    unitPrice: 150,
    status: "DELAYED",
    expectedDeliveryDate: new Date(Date.now() + 4.5 * 86400000).toISOString(),
    carrier: "Blue Dart Surface Freight",
    trackingNo: "BD-IN-991428",
    routeOrigin: "Orbital Warehouse, Pune MIDC",
    routeDestination: "Tata Motors EV Line 1, Pune"
  },
  {
    id: "po-1002",
    supplierId: "supplier-zenith",
    sku: "COMP-BETA",
    qty: 400,
    unitPrice: 210,
    status: "FULFILLED",
    expectedDeliveryDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    carrier: "DHL Express Air",
    trackingNo: "DHL-HYD-5501",
    routeOrigin: "Zenith Tech Park, Hyderabad",
    routeDestination: "Mahindra Aerospace, Nashik"
  },
  {
    id: "po-1003",
    supplierId: "supplier-apex",
    sku: "COMP-DELTA",
    qty: 350,
    unitPrice: 180,
    status: "SENT",
    expectedDeliveryDate: new Date(Date.now() + 3.5 * 86400000).toISOString(),
    carrier: "Gati-KWE Heavy Transport",
    trackingNo: "GK-CHN-7819",
    routeOrigin: "Apex Plant, Chennai",
    routeDestination: "Bajaj Auto Unit 2, Chakan"
  },
  {
    id: "po-1004",
    supplierId: "supplier-kalyani",
    sku: "COMP-DELTA",
    qty: 500,
    unitPrice: 170,
    status: "CONFIRMED",
    expectedDeliveryDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    carrier: "Mahindra Logistics Dedicated",
    trackingNo: "ML-PUN-0042",
    routeOrigin: "Kalyani Forgings, Mundhwa",
    routeDestination: "Bharat Forge Powertrain, Pune"
  }
];

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<EnrichedShipment[] | null>(null);
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
          const combined = [...data, ...DEFAULT_ENTERPRISE_SHIPMENTS.filter((o) => !apiIds.has(o.id))];
          setShipments(combined);
        }
      })
      .catch(() => {
        if (!cancelled) setShipments(DEFAULT_ENTERPRISE_SHIPMENTS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (shipments ?? DEFAULT_ENTERPRISE_SHIPMENTS).filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.id.toLowerCase().includes(term) ||
      o.sku.toLowerCase().includes(term) ||
      o.supplierId.toLowerCase().includes(term) ||
      (o.carrier ?? '').toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Shipments & Logistics Telemetry"
        description="Physical delivery telemetry, multi-carrier live tracking, and transit routes across component suppliers."
        icon={<Truck size={18} className="text-blue-600" />}
        actions={
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search carrier, tracking, PO..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>
        }
      />

      <div className="max-w-5xl w-full mx-auto p-6 lg:p-8 space-y-4 flex-1">
        {filtered.map((o) => {
          const isDelayed = o.status === 'DELAYED';
          const carrier = o.carrier ?? 'Blue Dart Surface Logistics';
          const trackingNo = o.trackingNo ?? 'BD-994120';
          const origin = o.routeOrigin ?? 'Vendor Origin Facility';
          const destination = o.routeDestination ?? 'Assembly Plant 1 · Line Alpha';

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
                    {isDelayed ? <AlertTriangle size={18} /> : <Truck size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-900 font-mono text-sm">{o.id}</h3>
                      <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/60 font-semibold">
                        {carrier}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        #{trackingNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                      <MapPin size={12} className="text-zinc-400" />
                      <span>{origin}</span>
                      <Navigation size={10} className="text-zinc-300" />
                      <span className="font-medium text-zinc-700">{destination}</span>
                    </div>
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
                        : o.status === 'FULFILLED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                    Disruption alert: In-transit shipment missed factory deadline buffer (+24h delay).
                  </span>
                  {o.caseId ? (
                    <button
                      onClick={() => setOpenCaseId(o.caseId!)}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700 transition-colors shadow-2xs"
                    >
                      <ShieldAlert size={13} />
                      <span>Inspect Recovery Case ({o.caseId.slice(0, 12)}…)</span>
                      <ArrowUpRight size={12} />
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400 font-mono">Case open in Mission Control</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openCaseId && <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />}
    </div>
  );
}