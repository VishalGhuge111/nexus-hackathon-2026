import React from 'react';
import type { Case } from '../../../../shared/types';
import { IncidentCard } from './IncidentCard';

interface IncidentGridProps { cases: Case[]; selectedId: string | null; onSelect: (id: string) => void; }

export function IncidentGrid({ cases, selectedId, onSelect }: IncidentGridProps) {
  if (!cases || cases.length === 0) {
    return <div className="p-8 text-center text-zinc-400 font-medium">No active incidents. All systems operational.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
      {cases.map((c, i) => (
        <IncidentCard key={c.id} case_={c} selected={selectedId === c.id} onClick={() => onSelect(c.id)} index={i} />
      ))}
    </div>
  );
}