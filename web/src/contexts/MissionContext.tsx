'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ScenarioType = 'HEALTHY' | 'WARNING' | 'RECOVERY' | 'APPROVAL';
export type IslandState = 'hidden' | 'idle' | 'investigating' | 'recovery' | 'completed';

export interface MissionKpis {
  ordersSafe: number;
  ordersAtRisk: number;
  coverage: number;
  recoveryCost: number;
}

interface MissionContextValue {
  scenario: ScenarioType;
  setScenario: (next: ScenarioType) => void;
  islandState: IslandState;
  setIslandState: (next: IslandState) => void;
  currentGoal: string;
  setCurrentGoal: (goal: string) => void;
  activeCaseId: string | null;
  openMission: (caseId: string) => void;
  clearMission: () => void;
  kpis: MissionKpis;
  auditLogs: Array<{ id: string; message: string; at: string }>; 
}

const defaultKpis: MissionKpis = {
  ordersSafe: 142,
  ordersAtRisk: 1,
  coverage: 5.4,
  recoveryCost: 18400
};

const defaultAuditLogs = [
  { id: 'audit-1', message: 'System healthy', at: '2026-08-23T00:00:00.000Z' }
];

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [scenario, setScenarioState] = useState<ScenarioType>('HEALTHY');
  const [islandState, setIslandStateState] = useState<IslandState>('idle');
  const [currentGoal, setCurrentGoalState] = useState('Maintain Production Continuity');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const setScenario = useCallback((next: ScenarioType) => {
    setScenarioState(next);
  }, []);

  const setIslandState = useCallback((next: IslandState) => {
    setIslandStateState(next);
  }, []);

  const openMission = useCallback((caseId: string) => {
    setActiveCaseId(caseId);
    setCurrentGoalState(`Investigating case ${caseId}`);
    setIslandStateState('investigating');
    setScenarioState('RECOVERY');
  }, []);

  const clearMission = useCallback(() => {
    setActiveCaseId(null);
    setIslandStateState('idle');
    setCurrentGoalState('Maintain Production Continuity');
  }, []);

  const value = useMemo<MissionContextValue>(() => ({
    scenario,
    setScenario,
    islandState,
    setIslandState,
    currentGoal,
    setCurrentGoal: setCurrentGoalState,
    activeCaseId,
    openMission,
    clearMission,
    kpis: defaultKpis,
    auditLogs: defaultAuditLogs
  }), [activeCaseId, currentGoal, islandState, openMission, clearMission, scenario, setScenario, setIslandState]);

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission(): MissionContextValue {
  const context = useContext(MissionContext);

  if (context) {
    return context;
  }

  return {
    scenario: 'HEALTHY',
    setScenario: () => undefined,
    islandState: 'idle',
    setIslandState: () => undefined,
    currentGoal: 'Maintain Production Continuity',
    setCurrentGoal: () => undefined,
    activeCaseId: null,
    openMission: () => undefined,
    clearMission: () => undefined,
    kpis: defaultKpis,
    auditLogs: defaultAuditLogs
  };
}
