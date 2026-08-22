// PRD §17 — supplier_eligibility_check.

export interface EligibilitySupplierInput {
  supplierId: string;
  certifications: string[];
  moq: number;
  maxCapacityPerCycle: number;
  reliabilityScore: number;
  qualityScore: number;
  leadTimeDays: number;
  hasOpenContradiction: boolean;
}

export interface EligibilityCaseContext {
  requiredCertifications: string[];
  qty: number;
  today: Date;
  neededBy: Date;
  deadlineSlackDays: number | null;
  minReliabilityForCase?: number;
  minQualityForCase?: number;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function supplierEligibilityCheck(
  supplier: EligibilitySupplierInput,
  ctx: EligibilityCaseContext
): EligibilityResult {
  const reasons: string[] = [];

  const missingCerts = ctx.requiredCertifications.filter(
    (c) => !supplier.certifications.includes(c)
  );
  if (missingCerts.length > 0) {
    reasons.push(`missing certification(s): ${missingCerts.join(",")}`);
  }

  if (ctx.qty < supplier.moq) {
    reasons.push(`quantity ${ctx.qty} below MOQ ${supplier.moq}`);
  }
  if (ctx.qty > supplier.maxCapacityPerCycle) {
    reasons.push(`quantity ${ctx.qty} exceeds capacity ${supplier.maxCapacityPerCycle}`);
  }

  // PRD §17: reliability floor raised to 0.7 when deadline slack < 1 day, default 0.5.
  const tightDeadline = ctx.deadlineSlackDays !== null && ctx.deadlineSlackDays < 1;
  const minReliability = ctx.minReliabilityForCase ?? (tightDeadline ? 0.7 : 0.5);
  if (supplier.reliabilityScore < minReliability) {
    reasons.push(`reliabilityScore ${supplier.reliabilityScore} below floor ${minReliability}`);
  }

  const minQuality = ctx.minQualityForCase ?? 0.7;
  if (supplier.qualityScore < minQuality) {
    reasons.push(`qualityScore ${supplier.qualityScore} below floor ${minQuality}`);
  }

  if (supplier.hasOpenContradiction) {
    reasons.push("unresolved tracking/supplier contradiction for this case");
  }

  const daysUntilNeeded = (ctx.neededBy.getTime() - ctx.today.getTime()) / MS_PER_DAY;
  if (supplier.leadTimeDays > daysUntilNeeded) {
    reasons.push(`lead time ${supplier.leadTimeDays}d exceeds ${daysUntilNeeded.toFixed(1)}d until neededBy`);
  }

  return { eligible: reasons.length === 0, reasons };
}
