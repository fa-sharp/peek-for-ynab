import { z } from "astro/zod";

/** Safe JSON parse refinement for Zod schemas */
export function zodJsonParse(input: string, ctx: z.core.$RefinementCtx) {
  try {
    return JSON.parse(input);
  } catch {
    ctx.issues.push({ code: "custom", message: "Invalid JSON", input });
    return z.NEVER;
  }
}
