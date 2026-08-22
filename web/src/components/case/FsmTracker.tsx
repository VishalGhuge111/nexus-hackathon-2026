import React from 'react';
import type { CaseStatus } from '../../../../shared/types';
import { Card, CardHeader } from '../ui/Card';

const FSM_STAGES = [
  'MONITORING',
  'EARLY_RISK_CHECK',
  'VERIFY',
  'PLAN',
  'VALIDATE',
  'HUMAN_ESCALATED_AWAITING_DECISION',
  'EXECUTE_OR_ESCALATE',
  'VERIFY_OUTCOME',
  'GOAL_ACHIEVED'
];

export function FsmTracker({ currentStep }: { currentStep: CaseStatus }) {
  const currentIndex = FSM_STAGES.indexOf(currentStep);
  
  return (
    <Card className="mb-6">
      <CardHeader title="Agent State Machine" subtitle="Lifecycle Progress" />
      <div className="relative pt-4">
        <div className="absolute top-8 left-0 h-0.5 bg-gray-800 w-full" />
        <div className="flex justify-between relative z-10">
          {FSM_STAGES.map((stage, i) => {
            const isCompleted = i < currentIndex || currentStep === 'GOAL_ACHIEVED';
            const isCurrent = i === currentIndex && currentStep !== 'GOAL_ACHIEVED';
            const isEscalated = stage === 'HUMAN_ESCALATED_AWAITING_DECISION' && isCurrent;
            
            return (
              <div key={stage} className="flex flex-col items-center w-1/8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                  ${isCompleted ? 'bg-green-900 border-green-500 text-green-400' : 
                    isEscalated ? 'bg-amber-900 border-amber-500 text-amber-400 animate-pulse' :
                    isCurrent ? 'bg-blue-900 border-blue-500 text-blue-400' : 
                    'bg-gray-900 border-gray-700 text-gray-500'}`}
                >
                  <span className="font-mono text-xs">{i + 1}</span>
                </div>
                <div className={`mt-3 text-[10px] uppercase font-mono tracking-wider text-center
                  ${isCurrent || isCompleted ? 'text-gray-300' : 'text-gray-600'}
                  ${isEscalated ? 'text-amber-400 font-bold' : ''}
                `}>
                  {stage.replace(/_/g, ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
