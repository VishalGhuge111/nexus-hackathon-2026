import React from 'react';
import { BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col h-full bg-zinc-50">
      <div className="bg-white border-b border-zinc-200 px-8 py-6 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <BarChart2 size={20} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Supply Chain Analytics</h1>
            <p className="text-sm text-zinc-500 font-medium">Performance metrics and historical trends.</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 grid grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Supplier Reliability Trend</h2>
          <div className="flex items-end gap-2 h-48 pb-2">
            {[45, 60, 55, 70, 65, 80, 87].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-100 hover:bg-blue-200 rounded-t-md relative group transition-colors" style={{ height: `${h}%` }}>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs py-1 px-2 rounded transition-opacity">
                  {h}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-2 border-t border-zinc-100 pt-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Cost Avoidance (Monthly)</h2>
          <div className="flex items-end gap-2 h-48 pb-2">
            {[30, 45, 20, 85, 40, 50, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-emerald-100 hover:bg-emerald-200 rounded-t-md relative group transition-colors" style={{ height: `${h}%` }}>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs py-1 px-2 rounded transition-opacity">
                  ₹{h}k
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-2 border-t border-zinc-100 pt-2">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
          </div>
        </div>
      </div>
    </div>
  );
}