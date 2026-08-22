import React from 'react';
import Link from 'next/link';
import type { Case } from '../../../../shared/types';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function ActiveCasesList({ cases }: { cases: Case[] }) {
  if (!cases || cases.length === 0) {
    return (
      <Card>
        <CardHeader title="Active Cases" />
        <div className="py-12 text-center text-muted-foreground font-mono">
          No active cases detected. Operational status normal.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Active Cases" subtitle="Live Case Tracking" />
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-sm text-muted-foreground border-collapse">
          <thead className="text-[10px] uppercase bg-muted/30 text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-4 tracking-widest font-bold rounded-l-md">Case ID</th>
              <th scope="col" className="px-6 py-4 tracking-widest font-bold">Order Ref</th>
              <th scope="col" className="px-6 py-4 tracking-widest font-bold">Priority</th>
              <th scope="col" className="px-6 py-4 tracking-widest font-bold">Status</th>
              <th scope="col" className="px-6 py-4 tracking-widest font-bold text-right rounded-r-md">Action</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            <tr className="h-2"></tr>
            {cases.map((c, i) => (
              <tr key={c.id} className={`group hover:bg-primary/5 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'}`}>
                <td className="px-6 py-4 font-mono font-medium text-foreground">{c.id}</td>
                <td className="px-6 py-4 font-mono text-muted-foreground group-hover:text-foreground transition-colors">{c.productionOrderId}</td>
                <td className="px-6 py-4">
                  <Badge variant={c.priority === 'CRITICAL' ? 'critical' : 'default'}>
                    {c.priority}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={
                    c.status === 'GOAL_ACHIEVED' ? 'success' :
                    c.status === 'HUMAN_ESCALATED_AWAITING_DECISION' ? 'warning' : 'default'
                  }>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={/cases/\} className="text-primary hover:text-primary-foreground hover:bg-primary px-4 py-2 rounded-md transition-all font-bold text-[10px] uppercase tracking-widest">
                    Inspect &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
