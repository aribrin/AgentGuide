import { Request, Response } from "express";
import { StepService } from "../services/stepService";
import { createStepSchema, updateStepSchema } from "../validation/stepSchemas";

export const StepController = {
  async create(req: Request, res: Response) {
    try {
      const parseResult = createStepSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: parseResult.error.issues,
        });
      }

      const step = await StepService.createStep({
        runId: Number(req.params.runId),
        ...parseResult.data,
        startedAt: parseResult.data.startedAt instanceof Date 
          ? parseResult.data.startedAt 
          : new Date(parseResult.data.startedAt),
      });

      return res.status(201).json(step);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to create step" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const parseResult = updateStepSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: parseResult.error.issues,
        });
      }

      const updateData = {
        ...parseResult.data,
        finishedAt: parseResult.data.finishedAt
          ? (parseResult.data.finishedAt instanceof Date 
              ? parseResult.data.finishedAt 
              : new Date(parseResult.data.finishedAt))
          : undefined,
      };

      const step = await StepService.updateStep(
        Number(req.params.stepId),
        updateData
      );

      return res.status(200).json(step);
    } catch (err: any) {
      console.error(err);
      // P2025 is Prisma's "Record not found" error code
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Step not found" });
      }
      return res.status(500).json({ error: "Failed to update step" });
    }
  },
};
