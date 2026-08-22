'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMission } from '../../contexts/MissionContext';
import { CheckCircle, ShieldAlert, Cpu, AlertTriangle, PlayCircle, Loader2, X, Check } from 'lucide-react';
import { bus } from '../../events/eventBus';

export function DynamicIsland() {
  const { islandState, currentGoal, activeCaseId, setIslandState, setScenario } = useMission();
  const [activity, setActivity] = useState('Analyzing parameters...');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (islandState === 'investigating') {
      const activities = [
        'Analyzing telemetry stream...',
        'Checking supplier buffers...',
        'Validating air freight lanes...',
        'Simulating production line impact...',
        'Synthesizing optimal recovery plan...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setActivity(activities[i]);
        i = (i + 1) % activities.length;
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [islandState]);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setIslandState('completed');
      bus.publish('NEW_NOTIFICATION', {
        id: Date.now().toString(),
        title: 'Recovery Executed',
        message: 'Dispatched expedited purchase order to Supplier B. Production protected.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      });

      // After showing completed state for 2.5s, collapse cleanly to idle and switch scenario to HEALTHY
      setTimeout(() => {
        setScenario('HEALTHY');
      }, 2500);
    }, 1500);
  };

  if (islandState === 'hidden') return null;

  const stateConfig = {
    idle: {
      width: 240, height: 38,
      content: (
        <div className="flex items-center justify-between gap-2 w-full px-3 h-full">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs font-bold text-white tracking-wide">All Systems Safe</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">100% NOMINAL</span>
        </div>
      )
    },
    investigating: {
      width: 380, height: 72,
      content: (
        <div className="flex items-center gap-3.5 w-full px-4 h-full">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
            <Cpu className="text-blue-400 w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-xs font-bold text-white truncate">{currentGoal}</p>
              {activeCaseId && (
                <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{activeCaseId}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
              <p className="text-[11px] text-zinc-400 truncate">{activity}</p>
            </div>
          </div>
          <button onClick={() => setIslandState('idle')} className="text-zinc-500 hover:text-white p-1">
            <X size={14} />
          </button>
        </div>
      )
    },
    recovery: {
      width: 440, height: 110,
      content: (
        <div className="flex flex-col w-full h-full p-3.5 justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-amber-400 w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{currentGoal}</p>
                <p className="text-[11px] text-zinc-400">Recovery Solution Ready</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeCaseId && (
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{activeCaseId}</span>
              )}
              <button onClick={() => setIslandState('idle')} className="text-zinc-500 hover:text-white p-1">
                <X size={14} />
              </button>
            </div>
          </div>
          
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between mt-1">
            <div>
              <p className="text-xs font-medium text-zinc-200">Supplier B (Air Freight Route)</p>
              <p className="text-[10px] text-zinc-400">+₹18.4k • ETA 2 Days • Risk: Low</p>
            </div>
            <button 
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-zinc-950 rounded-md text-xs font-bold hover:bg-zinc-100 transition-colors disabled:opacity-70"
            >
              {isExecuting ? (
                <><Loader2 size={12} className="animate-spin" /> Executing...</>
              ) : (
                <><PlayCircle size={13} /> Execute</>
              )}
            </button>
          </div>
        </div>
      )
    },
    completed: {
      width: 320, height: 48,
      content: (
        <div className="flex items-center justify-between gap-3 w-full px-4 h-full">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="text-emerald-400 w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Execution Successful</p>
              <p className="text-[10px] text-zinc-400">Production line protected</p>
            </div>
          </div>
          <button onClick={() => setIslandState('idle')} className="text-zinc-500 hover:text-white p-1">
            <X size={14} />
          </button>
        </div>
      )
    }
  };

  const config = stateConfig[islandState] || stateConfig.idle;

  return (
    <div className="sticky top-2 z-50 flex justify-center w-full pointer-events-none mb-2">
      <motion.div
        animate={{ width: config.width, height: config.height }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="bg-zinc-950/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 pointer-events-auto"
        style={{ willChange: 'width, height' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={islandState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            {config.content}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}