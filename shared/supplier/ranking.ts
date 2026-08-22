// PRD §17 RFQ scoring formula + §20 plan ranking order. Deterministic, no ML.

export interface RfqCandidate {
  supplierId: string;
  price: number;
  leadTimeDays: number;
  reliabilityScore: number;
  qualityScore: number;
  capacityOffered: number;
  requestedQty: number;
}

export function scoreRfqCandidate(
  candidate: RfqCandidate,
  poolMinPrice: number,
  poolMaxPrice: number,
  poolMinLeadTime: number,
  poolMaxLeadTime: number
): number {
  const priceRange = poolMaxPrice - poolMinPrice;
  const normalizedPriceInverse =
    priceRange === 0 ? 1 : 1 - (candidate.price - poolMinPrice) / priceRange;

  const leadRange = poolMaxLeadTime - poolMinLeadTime;
  const normalizedLeadTimeInverse =
    leadRange === 0 ? 1 : 1 - (candidate.leadTimeDays - poolMinLeadTime) / leadRange;

  const capacityFitRatio = Math.min(1, candidate.capacityOffered / candidate.requestedQty);

  return (
    0.3 * normalizedPriceInverse +
    0.25 * candidate.reliabilityScore +
    0.2 * candidate.qualityScore +
    0.15 * normalizedLeadTimeInverse +
    0.1 * capacityFitRatio
  );
}

export interface RankablePlan {
  planVersionId: string;
  deadlineBreached: boolean;
  incrementalCost: number;
  supplierCount: number;
  avgReliabilityAndQuality: number;
}

/**
 * PRD §20 ranking order: (1) any plan preventing deadlineBreached beats any that
 * doesn't; (2) lowest incrementalCost; (3) fewest suppliers; (4) highest average
 * (reliability+quality)/2. Computed deterministically so it can't be gamed by prompt
 * phrasing — the LLM only proposes candidates, never picks the winner.
 */
export function rankRecoveryPlans<T extends RankablePlan>(plans: T[]): T[] {
  return [...plans].sort((a, b) => {
    if (a.deadlineBreached !== b.deadlineBreached) {
      return a.deadlineBreached ? 1 : -1;
    }
    if (a.incrementalCost !== b.incrementalCost) {
      return a.incrementalCost - b.incrementalCost;
    }
    if (a.supplierCount !== b.supplierCount) {
      return a.supplierCount - b.supplierCount;
    }
    return b.avgReliabilityAndQuality - a.avgReliabilityAndQuality;
  });
}
