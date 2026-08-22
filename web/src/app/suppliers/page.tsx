'use client';
import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Search, Filter, Plus, User, MapPin, Activity, Package, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const mockSuppliers = [
    { id: 'SUP-A1', name: 'Alpha Manufacturing', location: 'Taiwan', reliability: '98%', status: 'Active' },
    { id: 'SUP-B2', name: 'Beta Components', location: 'Shenzhen, CN', reliability: '92%', status: 'Warning' },
    { id: 'SUP-C3', name: 'Gamma Precision', location: 'Germany', reliability: '99%', status: 'Active' },
  ];

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      setSheetOpen(false);
      toast.success('Supplier Onboarded', { description: 'New supplier has been added to the master list.' });
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 relative">
      <PageHeader 
        title="Supplier Network" 
        description="Manage and monitor tier-1 and tier-2 suppliers"
        icon={<User size={20} className="text-blue-600" />}
        actions={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50">
              <Filter size={16} /> Filter
            </button>
            <button 
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800"
            >
              <Plus size={16} /> Add Supplier
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search suppliers by name, region, or capability..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Supplier Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Reliability Index</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {mockSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-bold text-zinc-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <Package size={14} className="text-zinc-500 group-hover:text-blue-600" />
                        </div>
                        {s.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 flex items-center gap-2">
                      <MapPin size={14} className="text-zinc-400" /> {s.location}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 font-mono">{s.reliability}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-400 hover:text-blue-600 font-medium text-xs uppercase tracking-wider">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Sheet for Add Supplier */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSheetOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900">Onboard Supplier</h2>
              <button onClick={() => setSheetOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSupplier} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Company Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g. Omega Logistics" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Location</label>
                <input required type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g. Frankfurt, DE" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Capacity (Units)</label>
                  <input type="number" className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="10000" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Lead Time</label>
                  <input type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="5 Days" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Reliability Target</label>
                <select className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500">
                  <option>Tier 1 (&gt;99%)</option>
                  <option>Tier 2 (&gt;95%)</option>
                  <option>Tier 3 (&gt;90%)</option>
                </select>
              </div>
            </form>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex gap-3">
              <button 
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-lg font-bold hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSupplier}
                disabled={isAdding}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 disabled:opacity-70"
              >
                {isAdding ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Save Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}