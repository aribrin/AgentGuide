import { z } from "zod";
import { RunStatus } from "@prisma/client";

export const listRunsQuerySchema = z.object({
  agentId: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : undefined))
    .refine((v) => v === undefined || !isNaN(v), "Invalid agentId"),
  status: z.nativeEnum(RunStatus).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : 20))
    .refine((v) => v > 0 && v <= 100, "limit must be between 1 and 100"),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v) : 0))
    .refine((v) => v >= 0, "offset must be >= 0"),
});
