export interface ValidationResult {
	planVersionId: string;
	checks: { name: string; passed: boolean; expected: number | string; actual: number | string }[];
	overallPassed: boolean;
	withinApprovalThreshold: boolean;
}

export interface ApprovalRequest {
	id: string; caseId: string; planVersionId: string; brief: string;
	status: 'PENDING' | 'APPROVED' | 'REJECTED';
	resolvedBy?: string; resolvedAt?: string;
}
