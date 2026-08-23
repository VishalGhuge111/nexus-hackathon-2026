'use client';

import { useState } from 'react';
import { PlayCircle, Loader2, Sparkles } from 'lucide-react';
import { triggerShipmentDelay } from '../../lib/api-client';

export function TriggerEventButton({ onTriggered }: { onTriggered?: (caseId: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { caseId } = await triggerShipmentDelay(24);
      onTriggered?.(caseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-all hover:bg-blue-700 hover:shadow-xs active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
        title="Trigger 24h shipment delay simulation on COMP-ALPHA"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
        <span>{loading ? 'Simulating Disruption…' : 'Simulate 24h Delay'}</span>
      </button>
      {error && <span className="text-[11px] font-medium text-red-600 max-w-xs text-right">{error}</span>}
    </div>
  );
}