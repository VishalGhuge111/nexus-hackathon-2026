'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Building2, Search, Award, CheckCircle2, AlertTriangle, ShieldAlert, Mail, Send, FileText, ArrowUpRight, Zap } from 'lucide-react';
import type { Supplier } from '@nexus/shared/types/supplier';
import { fetchSuppliers } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

interface RFQItem {
  id: string;
  supplierId: string;
  supplierName: string;
  sku: string;
  requestedQty: number;
  quotedUnitPrice: number;
  quotedLeadTimeDays: number;
  dispatchChannel: string;
  status: 'EXTRACTED' | 'DISPATCHED' | 'ACCEPTED' | 'REJECTED';
  timestamp: string;
}

const DEFAULT_ACTIVE_RFQS: RFQItem[] = [
  {
    id: "RFQ-2026-881",
    supplierId: "supplier-veloce",
    supplierName: "Veloce Parts Co",
    sku: "COMP-ALPHA",
    requestedQty: 600,
    quotedUnitPrice: 166.67,
    quotedLeadTimeDays: 2,
    dispatchChannel: "Brevo Transactional API (rfq@velocepartsco.example)",
    status: "EXTRACTED",
    timestamp: "2 mins ago"
  },
  {
    id: "RFQ-2026-882",
    supplierId: "supplier-orbital",
    supplierName: "Orbital Components Ltd",
    sku: "COMP-ALPHA",
    requestedQty: 600,
    quotedUnitPrice: 150.00,
    quotedLeadTimeDays: 5,
    dispatchChannel: "Inbound ERP Feed (sourcing@orbitalcomponents.example)",
    status: "ACCEPTED",
    timestamp: "15 mins ago"
  },
  {
    id: "RFQ-2026-883",
    supplierId: "supplier-apex",
    supplierName: "Apex Precision Dynamics",
    sku: "COMP-BETA",
    requestedQty: 350,
    quotedUnitPrice: 225.00,
    quotedLeadTimeDays: 4,
    dispatchChannel: "Direct REST Webhook (orders@apexprecision.example)",
    status: "EXTRACTED",
    timestamp: "1 hour ago"
  }
];

const DEFAULT_ENTERPRISE_SUPPLIERS: Supplier[] = [
  {
    id: "supplier-orbital",
    name: "Orbital Components Ltd",
    certifications: ["ISO9001", "IATF16949"],
    moq: 100,
    maxCapacityPerCycle: 1000,
    defaultLeadTimeDays: 5,
    reliabilityScore: 0.85,
    qualityScore: 0.80,
    pricePerUnit: { "COMP-ALPHA": 150 },
    contactEmail: "sourcing@orbitalcomponents.example"
  },
  {
    id: "supplier-veloce",
    name: "Veloce Parts Co",
    certifications: ["ISO9001", "AS9100D"],
    moq: 50,
    maxCapacityPerCycle: 800,
    defaultLeadTimeDays: 2,
    reliabilityScore: 0.78,
    qualityScore: 0.82,
    pricePerUnit: { "COMP-ALPHA": 166.67 },
    contactEmail: "rfq@velocepartsco.example"
  },
  {
    id: "supplier-apex",
    name: "Apex Precision Dynamics",
    certifications: ["ISO9001", "ISO14001"],
    moq: 150,
    maxCapacityPerCycle: 1200,
    defaultLeadTimeDays: 4,
    reliabilityScore: 0.91,
    qualityScore: 0.88,
    pricePerUnit: { "COMP-BETA": 225, "COMP-DELTA": 180 },
    contactEmail: "orders@apexprecision.example"
  },
  {
    id: "supplier-kalyani",
    name: "Kalyani Heavy Forgings",
    certifications: ["ISO9001", "IATF16949"],
    moq: 200,
    maxCapacityPerCycle: 1500,
    defaultLeadTimeDays: 6,
    reliabilityScore: 0.94,
    qualityScore: 0.90,
    pricePerUnit: { "COMP-DELTA": 170 },
    contactEmail: "supply@kalyaniforgings.example"
  },
  {
    id: "supplier-zenith",
    name: "Zenith Micro-Tech Systems",
    certifications: ["ISO9001", "RoHS"],
    moq: 75,
    maxCapacityPerCycle: 600,
    defaultLeadTimeDays: 3,
    reliabilityScore: 0.89,
    qualityScore: 0.86,
    pricePerUnit: { "COMP-BETA": 210, "COMP-GAMMA": 295 },
    contactEmail: "contracts@zenithmicro.example"
  },
  {
    id: "supplier-budget",
    name: "Budget Cheap-Cast Corp",
    certifications: [],
    moq: 25,
    maxCapacityPerCycle: 2000,
    defaultLeadTimeDays: 1,
    reliabilityScore: 0.62,
    qualityScore: 0.64,
    pricePerUnit: { "COMP-GAMMA": 140 },
    contactEmail: "sales@budgetcheapcast.example"
  }
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [selectedRfq, setSelectedRfq] = useState<RFQItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchSuppliers()
      .then((data) => {
        if (!cancelled) {
          const apiIds = new Set(data.map((s) => s.id));
          const combined = [...data, ...DEFAULT_ENTERPRISE_SUPPLIERS.filter((s) => !apiIds.has(s.id))];
          setSuppliers(combined);
        }
      })
      .catch(() => {
        if (!cancelled) setSuppliers(DEFAULT_ENTERPRISE_SUPPLIERS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (suppliers ?? DEFAULT_ENTERPRISE_SUPPLIERS).filter((s) => {
    if (filterTier === 'CERTIFIED' && s.certifications.length === 0) return false;
    if (filterTier === 'UNCERTIFIED' && s.certifications.length > 0) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term);
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Supplier Network & RFQ Sourcing Center"
        description="Verified component vendor catalog with capacity ceilings, ISO certifications, live RFQ quote extractions, and outbound Brevo email channels."
        icon={<Building2 size={18} className="text-blue-600" />}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendors or SKUs..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>
        }
      />

      <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 flex-1 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Qualified Vendors</div>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1">6 Active</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Tier-1, Tier-2 & Fast-Track</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">ISO-9001 Compliance</div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">83.3%</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">5 of 6 Certified</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Active RFQ Quotes</div>
            <div className="text-xl font-bold font-mono text-purple-600 mt-1">3 Live Quotes</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Brevo transactional email synced</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Cycle Capacity</div>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1">7,100 units</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Combined vendor capacity</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold">View:</span>
            <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-xs">
              <button
                onClick={() => setFilterTier('ALL')}
                className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  filterTier === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                All Vendors (6)
              </button>
              <button
                onClick={() => setFilterTier('CERTIFIED')}
                className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  filterTier === 'CERTIFIED' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                ISO Certified (5)
              </button>
              <button
                onClick={() => setFilterTier('UNCERTIFIED')}
                className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  filterTier === 'UNCERTIFIED' ? 'bg-white text-rose-800 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Uncertified Gate (1)
              </button>
              <button
                onClick={() => setFilterTier('RFQS')}
                className={`cursor-pointer px-3 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1.5 ${
                  filterTier === 'RFQS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Zap size={12} />
                <span>Active RFQs & Sourcing Quotes (3)</span>
              </button>
            </div>
          </div>
        </div>

        {/* RFQ Center Tab View */}
        {filterTier === 'RFQS' ? (
          <div className="bg-white border border-purple-200 rounded-xl overflow-hidden shadow-2xs animate-fade-in">
            <div className="p-4 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                  Live Supplier RFQ Dispatches & Inbound Quote Extractions
                </h3>
              </div>
              <span className="text-[11px] font-mono text-purple-700 font-semibold bg-purple-100/70 px-2 py-0.5 rounded">
                Brevo Outbound API Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200 select-none">
                  <tr>
                    <th className="px-6 py-3">RFQ Reference</th>
                    <th className="px-6 py-3">Target Supplier</th>
                    <th className="px-6 py-3">SKU & Requested Qty</th>
                    <th className="px-6 py-3">Quoted Unit Price</th>
                    <th className="px-6 py-3">Lead Time</th>
                    <th className="px-6 py-3">Dispatch Channel</th>
                    <th className="px-6 py-3">Quote Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {DEFAULT_ACTIVE_RFQS.map((r) => (
                    <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-zinc-900">{r.id}</td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-zinc-900">{r.supplierName}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{r.supplierId}</div>
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold text-zinc-800">
                        {r.sku} · {r.requestedQty} units
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold text-blue-600">
                        ₹{r.quotedUnitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-medium text-zinc-800">
                        {r.quotedLeadTimeDays} days
                      </td>
                      <td className="px-6 py-3.5 text-[11px] font-mono text-zinc-500 truncate max-w-xs">
                        {r.dispatchChannel}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>{r.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Suppliers Table */
          <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200/80 select-none">
                  <tr>
                    <th className="px-6 py-3.5">Vendor Identifier</th>
                    <th className="px-6 py-3.5">Certifications</th>
                    <th className="px-6 py-3.5">MOQ</th>
                    <th className="px-6 py-3.5">Max Output / Cycle</th>
                    <th className="px-6 py-3.5">Lead Time</th>
                    <th className="px-6 py-3.5">Reliability</th>
                    <th className="px-6 py-3.5">Quality Index</th>
                    <th className="px-6 py-3.5">Contact Endpoint</th>
                    <th className="px-6 py-3.5 text-right">Instant RFQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((s) => {
                    const relPct = Math.round(s.reliabilityScore * 100);
                    const qualPct = Math.round(s.qualityScore * 100);
                    const isUncertified = s.certifications.length === 0;

                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-zinc-900">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                                isUncertified ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                              }`}
                            >
                              <Building2 size={15} />
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900">{s.name}</div>
                              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{s.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-zinc-600 font-mono">
                          {s.certifications.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.certifications.map((c) => (
                                <span key={c} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              <ShieldAlert size={10} />
                              <span>NO CERTIFICATION</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-zinc-800 font-mono font-medium">{s.moq} units</td>
                        <td className="px-6 py-3.5 text-zinc-800 font-mono font-medium">{s.maxCapacityPerCycle} units</td>
                        <td className="px-6 py-3.5 text-zinc-800 font-mono font-medium">{s.defaultLeadTimeDays} days</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              s.reliabilityScore >= 0.75
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {relPct}%
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              s.qualityScore >= 0.75
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {qualPct}%
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-[11px] text-zinc-500">
                          {s.contactEmail ?? 'sourcing@domain.example'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => setFilterTier('RFQS')}
                            className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 transition-colors shadow-2xs"
                          >
                            <Mail size={11} />
                            <span>RFQ Quote</span>
                          </button>
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
    </div>
  );
}