'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Search, Building2, Package, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { fetchSuppliers } from '../../lib/api-client';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import type { Supplier } from '@nexus/shared/types/supplier';

function SuppliersTableSkeleton() {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
      <table className="w-full text-xs text-left">
        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
          <tr>
            <th className="px-6 py-3.5">Supplier</th>
            <th className="px-6 py-3.5">Certifications</th>
            <th className="px-6 py-3.5">MOQ</th>
            <th className="px-6 py-3.5">Max Output / Cycle</th>
            <th className="px-6 py-3.5">Lead Time</th>
            <th className="px-6 py-3.5">Reliability</th>
            <th className="px-6 py-3.5">Quality Index</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {[1, 2, 3, 4].map((i) => (
            <tr key={i}>
              <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-3.5"><Skeleton className="h-4 w-24" /></td>
              <td className="px-6 py-3.5"><Skeleton className="h-4 w-12" /></td>
              <td className="px-6 py-3.5"><Skeleton className="h-4 w-12" /></td>
              <td className="px-6 py-3.5"><Skeleton className="h-4 w-12" /></td>
              <td className="px-6 py-3.5"><Skeleton className="h-5 w-14 rounded-full" /></td>
              <td className="px-6 py-3.5"><Skeleton className="h-5 w-14 rounded-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchSuppliers()
      .then((data) => {
        if (!cancelled) setSuppliers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = (suppliers ?? []).filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term);
  });

  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50/70">
      <PageHeader
        title="Supplier Network"
        description="Verified component vendor roster with capacity ceilings, ISO certifications, and historical reliability indexes."
        icon={<Building2 size={18} className="text-blue-600" />}
      />

      {/* Search Bar */}
      <div className="bg-white border-b border-zinc-200/80 px-6 lg:px-8 py-3 shrink-0 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search suppliers by vendor name or identifier..."
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50/80 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <span className="text-xs font-mono text-zinc-400">
          Showing {filtered.length} of {suppliers?.length ?? 0} supplier(s)
        </span>
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 lg:p-8 flex-1">
        {error ? (
          <ErrorState message={`Failed to load suppliers: ${error}`} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : !suppliers ? (
          <SuppliersTableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-xl p-12 text-center text-xs text-zinc-500">
            {suppliers.length === 0 ? 'No suppliers registered in active store.' : 'No suppliers match your search filter.'}
          </div>
        ) : (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((s) => {
                    const relPct = Math.round(s.reliabilityScore * 100);
                    const qualPct = Math.round(s.qualityScore * 100);
                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-zinc-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
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
                                <span key={c} className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-300">None listed</span>
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