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
        <div className="py-8 text-center text-gray-500 font-mono">
          No active cases detected. Operational status normal.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Active Cases" subtitle="Live Case Tracking" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="text-xs uppercase bg-gray-900 text-gray-500 border-b border-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 font-mono">Case ID</th>
              <th scope="col" className="px-4 py-3 font-mono">Order Ref</th>
              <th scope="col" className="px-4 py-3 font-mono">Priority</th>
              <th scope="col" className="px-4 py-3 font-mono">Status</th>
              <th scope="col" className="px-4 py-3 font-mono text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 font-mono font-medium text-gray-300">{c.id}</td>
                <td className="px-4 py-3 font-mono">{c.productionOrderId}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.priority === 'CRITICAL' ? 'critical' : 'default'}>
                    {c.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={
                    c.status === 'GOAL_ACHIEVED' ? 'success' :
                    c.status === 'HUMAN_ESCALATED_AWAITING_DECISION' ? 'warning' : 'default'
                  }>
                    {c.status.replace(/_/g, ' ')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/cases/${c.id}`} className="text-blue-400 hover:text-blue-300 font-mono text-xs uppercase tracking-wider">
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
