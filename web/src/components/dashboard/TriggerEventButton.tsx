'use client';

// Real judge/demo control — calls the real POST /api/agent/event contract
// (shared/agent/events.ts) instead of requiring curl. No optimistic/fake
// success: the button shows its real network state, and surfaces the real
// error text from the API on failure (e.g. "already an active case for this
// production order").
import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
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
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
        {loading ? 'Triggering…' : 'Trigger Shipment Delay 24h'}
      </button>
      {error && <span className="text-xs text-red-600 max-w-xs text-right">{error}</span>}
    </div>
  );
}
