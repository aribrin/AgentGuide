import { z } from "zod";

export const createStepSchema = z.object({
  index: z.number().int().nonnegative(),
  toolName: z.string().min(1, "Tool name cannot be empty"),
  input: z.any(),
  startedAt: z.union([z.string(), z.date()]),
});

export const updateStepSchema = z.object({
  output: z.any().optional(),
  error: z.string().optional(),
  finishedAt: z.union([z.string(), z.date()]).optional(),
});
