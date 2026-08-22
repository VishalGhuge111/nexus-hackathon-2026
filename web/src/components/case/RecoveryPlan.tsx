import React from 'react';
import { Card, CardHeader } from '../ui/Card';

export function RecoveryPlan({ plan, validation }: { plan: any, validation?: any }) {
  if (!plan && !validation) return null;

  return (
    <Card className="mb-6">
      <CardHeader title="Proposed Recovery Plan" subtitle="Agent Remediation Strategy" />
      <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap p-4 bg-gray-950 border border-gray-800 rounded-md">
        {plan ? JSON.stringify(plan, null, 2) : "Plan generation in progress..."}
      </div>

      {validation && (
        <div className="mt-4 p-4 border border-blue-900/50 bg-blue-950/20 rounded-md">
          <h3 className="text-blue-400 font-bold font-mono mb-2">Deterministic Validation Result</h3>
          <ul className="space-y-1 text-sm text-gray-300">
            {validation.checks?.map((check: any, idx: number) => (
              <li key={idx} className="flex items-center">
                <span className={`mr-2 ${check.passed ? 'text-green-500' : 'text-red-500'}`}>
                  {check.passed ? '✓' : '✗'}
                </span>
                <span className="font-mono">{check.name}: expected {check.expected}, got {check.actual}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
