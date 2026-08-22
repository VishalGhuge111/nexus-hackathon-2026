import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const STEPS = ['Detected', 'Verified', 'Investigating', 'Supplier Contacted', 'Recovery Selected', 'Validated', 'Executed'];

export function HorizontalTimeline({ completedCount }: { completedCount: number }) {
  return (
    <div className="relative py-3 overflow-x-auto">
      <div className="flex items-center min-w-max gap-0 mx-2">
        {STEPS.map((step, i) => {
          const done = i < completedCount;
          const current = i === completedCount;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? 'bg-emerald-500 border-emerald-500' : current ? 'bg-blue-500 border-blue-500 animate-pulse' : 'bg-white border-zinc-300'}`}>
                  {done ? <CheckCircle size={12} className="text-white" /> : <Circle size={10} className={current ? 'text-white' : 'text-zinc-400'} />}
                </div>
                <p className={`text-[9px] font-medium text-center max-w-[60px] leading-tight
                  ${done ? 'text-emerald-600' : current ? 'text-blue-600' : 'text-zinc-400'}`}>
                  {step}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 shrink-0 -mt-4 ${i < completedCount ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}