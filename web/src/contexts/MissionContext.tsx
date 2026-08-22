'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { bus } from '../events/eventBus';
import type { DashboardSummary } from '../lib/api-client';

export type ScenarioType = 'HEALTHY' | 'WARNING' | 'RECOVERY' | 'APPROVAL';

interface MissionState {
  scenario: ScenarioType;
  kpis: { ordersSafe: number; ordersAtRisk: number; coverage: number; recoveryCost: number };
  activeCaseId: string | null;
  islandState: 'idle' | 'investigating' | 'recovery' | 'completed' | 'hidden';
  currentGoal: string;
  auditLogs: any[];
}

interface MissionContextValue extends MissionState {
  setScenario: (scenario: ScenarioType) => void;
  openMission: (caseId: string) => void;
  setIslandState: (state: 'idle' | 'investigating' | 'recovery' | 'completed' | 'hidden') => void;
  setCurrentGoal: (goal: string) => void;
  updateKpi: (key: keyof MissionState['kpis'], value: number) => void;
  addAuditLog: (log: any) => void;
}

const MissionContext = createContext<MissionContextValue | undefined>(undefined);

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MissionState>({
    scenario: 'HEALTHY',
    kpis: { ordersSafe: 454, ordersAtRisk: 0, coverage: 15, recoveryCost: 0 },
    activeCaseId: null,
    islandState: 'idle',
    currentGoal: 'Maintain Production Continuity',
    auditLogs: []
  });

  useEffect(() => {
    const unsub1 = bus.subscribe('SHIPMENT_DELAY', (payload) => {
      setState(s => ({ 
        ...s, 
        scenario: 'RECOVERY', 
        islandState: 'recovery', 
        currentGoal: 'Resolve Critical Delay', 
        activeCaseId: payload.caseId || 'CASE-003' 
      }));
      bus.publish('NEW_NOTIFICATION', {
        id: Date.now().toString(),
        title: 'Shipment Delayed',
        message: `Shipment for ${payload.caseId || 'CASE-003'} delayed by 7 days.`,
        type: 'error',
        timestamp: new Date().toISOString(),
        read: false,
        action: { label: 'Open Mission', event: 'OPEN_MISSION', payload: { caseId: payload.caseId || 'CASE-003' } }
      });
    });

    const unsub2 = bus.subscribe('OPEN_MISSION', (payload) => {
      setState(s => ({ 
        ...s, 
        scenario: 'RECOVERY',
        activeCaseId: payload.caseId, 
        islandState: 'investigating', 
        currentGoal: 'Simulating Recovery Strategies' 
      }));
      setTimeout(() => {
        setState(s => ({
          ...s,
          islandState: 'recovery',
          currentGoal: 'Execute Recovery Plan'
        }));
      }, 2500);
    });

    const unsub3 = bus.subscribe('SCENARIO_CHANGED', (payload) => {
      const scen: ScenarioType = payload.scenario;
      if (scen === 'HEALTHY') {
        setState(s => ({
          ...s,
          scenario: 'HEALTHY',
          islandState: 'idle',
          currentGoal: 'Maintain Production Continuity',
          activeCaseId: null
        }));
      } else if (scen === 'WARNING') {
        setState(s => ({
          ...s,
          scenario: 'WARNING',
          islandState: 'investigating',
          currentGoal: 'Monitoring Early Deviation',
          activeCaseId: 'CASE-002'
        }));
      } else if (scen === 'RECOVERY') {
        setState(s => ({
          ...s,
          scenario: 'RECOVERY',
          islandState: 'recovery',
          currentGoal: 'Protect Production Line',
          activeCaseId: 'CASE-003'
        }));
      } else if (scen === 'APPROVAL') {
        setState(s => ({
          ...s,
          scenario: 'APPROVAL',
          islandState: 'completed',
          currentGoal: 'Human Approval Verified',
          activeCaseId: 'CASE-003'
        }));
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const value: MissionContextValue = {
    ...state,
    setScenario: (scenario) => bus.publish('SCENARIO_CHANGED', { scenario }),
    openMission: (caseId) => bus.publish('OPEN_MISSION', { caseId }),
    setIslandState: (islandState) => setState(s => ({ ...s, islandState })),
    setCurrentGoal: (currentGoal) => setState(s => ({ ...s, currentGoal })),
    updateKpi: (key, value) => setState(s => ({ ...s, kpis: { ...s.kpis, [key]: value } })),
    addAuditLog: (log) => setState(s => ({ ...s, auditLogs: [log, ...s.auditLogs] }))
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const context = useContext(MissionContext);
  if (!context) throw new Error('useMission must be used within a MissionProvider');
  return context;
}