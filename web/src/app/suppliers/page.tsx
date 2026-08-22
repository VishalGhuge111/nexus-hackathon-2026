'use client';
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Search, User, Package, Loader2 } from 'lucide-react';
import { fetchSuppliers } from '../../lib/api-client';
import type { Supplier } from '@nexus/shared/types/supplier';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchSuppliers()
      .then((data) => { if (!cancelled) setSuppliers(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); });
    return () => { cancelled = true; };
  }, []);

  const filtered = (suppliers ?? []).filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative">
      <PageHeader
        title="Supplier Network"
        description="Real supplier roster from the current Store (certifications, capacity, scores)."
        icon={<User size={20} className="text-blue-600" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers by name or ID..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load suppliers: {error}
            </div>
          )}

          {!suppliers && !error ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-zinc-400">
              <Loader2 size={16} className="animate-spin" /> Loading suppliers…
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center text-sm text-zinc-500">
              No suppliers found.
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Certifications</th>
                    <th className="px-6 py-4">MOQ</th>
                    <th className="px-6 py-4">Max Capacity / Cycle</th>
                    <th className="px-6 py-4">Lead Time</th>
                    <th className="px-6 py-4">Reliability</th>
                    <th className="px-6 py-4">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center">
                            <Package size={14} className="text-zinc-500" />
                          </div>
                          <div>
                            <div>{s.name}</div>
                            <div className="text-xs font-mono font-normal text-zinc-400">{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600">
                        {s.certifications.length > 0 ? s.certifications.join(', ') : 'No data'}
                      </td>
                      <td className="px-6 py-4 text-zinc-900 font-mono">{s.moq}</td>
                      <td className="px-6 py-4 text-zinc-900 font-mono">{s.maxCapacityPerCycle}</td>
                      <td className="px-6 py-4 text-zinc-900 font-mono">{s.defaultLeadTimeDays}d</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${s.reliabilityScore >= 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {(s.reliabilityScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${s.qualityScore >= 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {(s.qualityScore * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
