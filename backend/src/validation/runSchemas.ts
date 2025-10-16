import { z } from "zod";

// Create Run schema
export const createRunSchema = z.object({
  agentId: z.number(),
  userId: z.number().optional(),
  input: z.record(z.string(), z.any()).refine(
    (val) => typeof val === "object" && val !== null,
    { message: "input must be an object" }
  ),
});

// Create Step schema
export const createStepSchema = z.object({
  index: z.number(),
  toolName: z.string(),
  input: z.record(z.string(), z.any()),
  startedAt: z.coerce.date(),
});

// Update Step schema
export const updateStepSchema = z.object({
  output: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  finishedAt: z.coerce.date().optional(),
});

// Update Run schema
export const updateRunSchema = z.object({
  status: z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
  output: z.record(z.string(), z.any()).optional(),
  finishedAt: z.coerce.date().optional(),
});
