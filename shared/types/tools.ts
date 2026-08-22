export interface ToolResult<T = unknown> {
	toolName: string;
	status: 'SUCCESS' | 'FAILURE' | 'NO_DATA';
	data?: T;
	errorReason?: string;
	staleness?: 'FRESH' | 'STALE';
	latencyMs: number;
}
