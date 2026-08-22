export type CaseStatus =
	| 'OPEN' | 'MONITORING' | 'EARLY_RISK_CHECK' | 'VERIFY' | 'PLAN'
	| 'VALIDATE' | 'EXECUTE_OR_ESCALATE' | 'VERIFY_OUTCOME' | 'ADAPT_REPLAN'
	| 'QUEUED' | 'GOAL_ACHIEVED' | 'HUMAN_ESCALATED_AWAITING_DECISION'
	| 'NO_FEASIBLE_RECOVERY';

export interface Case {
	id: string;
	productionOrderId: string;
	status: CaseStatus;
	priority: 'STANDARD' | 'CRITICAL';
	riskSignals: RiskSignal[];
	activePlanVersion: number;
	replanCount: number;
	continuityImpact: { unitsAtRisk: number; deadlineBreached: boolean };
	createdAt: string;
	updatedAt: string;
	queuedBehindCaseId?: string;
}

export interface RiskSignal {
	id: string;
	caseId: string;
	indicator: string;
	value: number;
	threshold: number;
	cycle: number;
	timestamp: string;
	source: 'inventory' | 'tracking' | 'supplierMessage' | 'erp';
}
