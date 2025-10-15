import { Request, Response } from "express";
import { StepService } from "../services/stepService";
import { createStepSchema, updateStepSchema } from "../validation/runSchemas";

export const StepController = {
  async create(req: Request, res: Response) {
    try {
      const parsed = createStepSchema.parse(req.body);
      const runId = Number(req.params.runId);
      const step = await StepService.createStep({
        ...parsed,
        runId,
      });
      res.status(201).json(step);
      return;
    } catch (err) {
      if (err instanceof Error && "issues" in (err as any)) {
        return res.status(400).json({ error: "Invalid input", details: (err as any).issues });
      }
      console.error(err);
      res.status(500).json({ error: "Failed to create step" });
      return;
    }
  },

  async update(req: Request, res: Response) {
    try {
      const parsed = updateStepSchema.parse(req.body);
      const stepId = Number(req.params.stepId);
      const step = await StepService.updateStep(stepId, parsed);
      res.json(step);
      return;
    } catch (err) {
      if (err instanceof Error && "issues" in (err as any)) {
        return res.status(400).json({ error: "Invalid input", details: (err as any).issues });
      }
      console.error(err);
      res.status(500).json({ error: "Failed to update step" });
      return;
    }
  },
};
