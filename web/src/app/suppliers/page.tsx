'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Building2, Search, Award, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Supplier } from '@nexus/shared/types/supplier';
import { fetchSuppliers } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

// Complete enterprise supplier roster for demo presentation
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
    certifications: [], // Missing ISO9001 for Negative Quality Gate testing
    moq: 25,
    maxCapacityPerCycle: 2000,
    defaultLeadTimeDays: 1,
    reliabilityScore: 0.62,
    qualityScore: 0.64, // Fails 0.70 quality threshold
    pricePerUnit: { "COMP-GAMMA": 140 },
    contactEmail: "sales@budgetcheapcast.example"
  }
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchSuppliers()
      .then((data) => {
        if (!cancelled) {
          // Merge API suppliers with enterprise catalog
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
        title="Supplier Network & Catalog"
        description="Verified component vendor roster with capacity ceilings, ISO certifications, quality benchmarks, and real-time contact endpoints."
        icon={<Building2 size={18} className="text-blue-600" />}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendors..."
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
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Avg Quality Score</div>
            <div className="text-xl font-bold font-mono text-blue-600 mt-1">0.82 / 1.0</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Benchmark ≥ 0.70</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Total Cycle Capacity</div>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1">7,100 units</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Combined vendor capacity</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold">Filter:</span>
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
          </div>
        </div>

        {/* Suppliers Table */}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}