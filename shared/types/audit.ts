export interface AuditEvent {
	id: string; caseId: string; cycle: number; timestamp: string;
	actor: 'AGENT' | 'HUMAN' | 'SYSTEM';
	type: 'STATE_TRANSITION' | 'TOOL_CALL' | 'LLM_CALL' | 'VALIDATION' | 'HUMAN_ACTION';
	summary: string; detail: Record<string, unknown>;
}
