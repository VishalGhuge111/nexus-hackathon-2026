'use client';
import React from 'react';
import { Settings as SettingsIcon, Shield, User, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <PageHeader
        title="System Settings"
        description="Configure NEXUS parameters and integrations."
        icon={<SettingsIcon size={20} className="text-zinc-600" />}
        showBack={true}
      />
      
      <div className="p-8 max-w-2xl">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2"><User size={18} className="text-zinc-400" /> Profile & Account</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Name</label>
                <input type="text" defaultValue="Operations Lead" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email</label>
                <input type="email" defaultValue="ops@nexus.local" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-zinc-400" /> Auto-Approval Thresholds</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Maximum Cost Recovery without Human Approval</label>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-medium">₹</span>
                  <input type="number" defaultValue={25000} className="w-48 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-md">If a recovery plan costs more than this threshold, NEXUS will halt execution and escalate to a human operator for final authorization.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-zinc-50 flex justify-end">
            <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}