// PRD §34 — strict Zod parse on every LLM output; malformed output triggers one
// bounded re-prompt, never a silent stall or a fabricated plan.
import { z } from "zod";

export const ProposedPlanSchema = z.object({
  allocations: z
    .array(
      z.object({
        supplierId: z.string().min(1),
        qty: z.number().positive()
      })
    )
    .min(1)
    .max(3),
  rationale: z.string().min(1)
});
