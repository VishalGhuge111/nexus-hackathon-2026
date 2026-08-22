import React from 'react';
import { Settings as SettingsIcon, Shield, Bell, User } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-8 py-6 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
            <SettingsIcon size={20} className="text-zinc-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">System Settings</h1>
            <p className="text-sm text-zinc-500 font-medium">Configure NEXUS parameters and integrations.</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 max-w-2xl">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2"><User size={18} className="text-zinc-400" /> Profile & Account</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Name</label>
                <input type="text" defaultValue="Operations Lead" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email</label>
                <input type="email" defaultValue="ops@nexus.local" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm" />
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2"><Shield size={18} className="text-zinc-400" /> Auto-Approval Thresholds</h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Maximum Cost Recovery without Human Approval</label>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">₹</span>
                  <input type="number" defaultValue={25000} className="w-48 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm" />
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">If a recovery plan costs more than this, NEXUS will escalate to a human operator.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-zinc-50">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}