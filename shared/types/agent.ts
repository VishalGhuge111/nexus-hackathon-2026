import type { CaseStatus } from './case';

export interface AgentState {
	caseId: string;
	currentStep: CaseStatus;
	cycle: number;
	lastToolCalls: string[];
	toolCallCount: number;
	lastLlmModel?: 'haiku' | 'sonnet';
	pendingLlmTask?: string;
	updatedAt: string;
}
