'use client';
import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Star, TrendingUp } from 'lucide-react';
import { DecisionActivity } from './DecisionActivity';
import { HorizontalTimeline } from './HorizontalTimeline';
import { resolveApproval } from '../../lib/api-client';
import type { CaseDetail } from '../../lib/api-client';

const SUPPLIERS = [
  { name: 'Supplier A', eta: '5 Days', cost: '₹41,000', risk: 'High', continuity: 'Production Stops', recommended: false, decision: 'reject' },
  { name: 'Supplier B', eta: '2 Days', cost: '₹45,000', risk: 'Low', continuity: 'Protected', recommended: true, decision: 'approve' },
  { name: 'Supplier C', eta: '3 Days', cost: '₹48,000', risk: 'Medium', continuity: '4h Delay', recommended: false, decision: 'pending' },
];

const STARS = 5;

export function IslandRecovery({ detail, onResolved, needsApproval }: { detail: CaseDetail; onResolved: () => void; needsApproval: boolean }) {
  const [loading, setLoading] = useState(false);
  const { caseRecord, auditEvents } = detail;

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    await resolveApproval(caseRecord.id, decision);
    setLoading(false);
    onResolved();
  };

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-900">Best Recovery Identified</h3>
          <p className="text-sm text-zinc-500 mt-0.5">Supplier B · ₹45,000 · ETA 2 Days</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Progress</p>
        <HorizontalTimeline completedCount={5} />
      </div>

      {/* Recovery Comparison Table */}
      <div>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Recovery Options</p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 text-left font-bold">Supplier</th>
                <th className="py-2 px-2 text-left font-bold">ETA</th>
                <th className="py-2 px-2 text-left font-bold">Cost</th>
                <th className="py-2 px-2 text-left font-bold">Risk</th>
                <th className="py-2 px-2 text-left font-bold">Continuity</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS.map(s => (
                <tr key={s.name} className={`border-t border-zinc-100 ${s.recommended ? 'bg-blue-50' : ''}`}>
                  <td className="py-2 px-3 font-semibold text-zinc-800">
                    {s.name} {s.recommended && <span className="ml-1 text-blue-600">⭐</span>}
                  </td>
                  <td className={`py-2 px-2 ${s.recommended ? 'font-bold text-zinc-900' : 'text-zinc-600'}`}>{s.eta}</td>
                  <td className="py-2 px-2 text-zinc-600">{s.cost}</td>
                  <td className={`py-2 px-2 font-medium ${s.risk === 'Low' ? 'text-emerald-600' : s.risk === 'High' ? 'text-red-600' : 'text-amber-600'}`}>{s.risk}</td>
                  <td className="py-2 px-2">
                    {s.continuity === 'Protected' ? <span className="text-emerald-600 font-medium">✅ Protected</span>
                     : s.continuity === 'Production Stops' ? <span className="text-red-600">❌ Stops</span>
                     : <span className="text-amber-600">⚠ {s.continuity}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Why Supplier B */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Why Supplier B?</p>
          <div className="flex gap-0.5">
            {Array.from({ length: STARS }).map((_, i) => <Star key={i} size={11} className="text-blue-500 fill-blue-500" />)}
            <span className="text-xs text-blue-600 font-bold ml-1">Excellent</span>
          </div>
        </div>
        <ul className="space-y-1 text-xs text-blue-800">
          <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-500 shrink-0" /> Earliest delivery (2 days) — meets production deadline</li>
          <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-500 shrink-0" /> Lowest operational risk among all alternatives</li>
          <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-emerald-500 shrink-0" /> Cost increase only 9.8% vs baseline</li>
        </ul>
      </div>

      {/* Business Impact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Without Action</p>
          <div className="space-y-1.5 text-xs text-red-800">
            <div className="flex items-center gap-1"><XCircle size={11} className="shrink-0" /> Production stops in 18h</div>
            <div><span className="font-bold">42</span> orders delayed</div>
            <div>Revenue at risk: <span className="font-bold">₹3.2L</span></div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">NEXUS Plan</p>
          <div className="space-y-1.5 text-xs text-emerald-800">
            <div className="flex items-center gap-1"><CheckCircle size={11} className="shrink-0" /> Downtime: <span className="font-bold">0 hr</span></div>
            <div><span className="font-bold">42</span> orders saved</div>
            <div>Recovery cost: <span className="font-bold">₹18,400</span></div>
          </div>
        </div>
      </div>

      {/* Approval if needed */}
      {needsApproval && (
        <div className="border-t border-zinc-100 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Approval Required</p>
            <p className="text-sm text-amber-800">Switch to Supplier B · Extra cost: <strong>₹4,200</strong></p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDecision('REJECTED')}
              disabled={loading}
              className="flex-1 py-2.5 px-3 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleDecision('APPROVED')}
              disabled={loading}
              className="flex-[2] py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Authorize Execution'}
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-100 pt-4">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Decision Activity</p>
        <DecisionActivity events={auditEvents} />
      </div>
    </div>
  );
}