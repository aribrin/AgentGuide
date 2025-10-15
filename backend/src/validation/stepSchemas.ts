import { z } from "zod";

export const createStepSchema = z.object({
  index: z
    .number({ error: "Step index is required" })
    .int()
    .nonnegative(),
  toolName: z
    .string({ error: "Tool name is required" })
    .min(1, "Tool name cannot be empty"),
  input: z.record(z.string(), z.any()),
  startedAt: z
    .string({ error: "StartedAt timestamp is required" })
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
});

export const updateStepSchema = z.object({
  output: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  finishedAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
});
