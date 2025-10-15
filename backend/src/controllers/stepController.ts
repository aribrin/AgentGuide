import { Request, Response } from "express";
import { StepService } from "../services/stepService";

export const StepController = {
  async create(req: Request, res: Response) {
    try {
      const runId = Number(req.params.runId);
      const { index, toolName, input, startedAt } = req.body;
      const step = await StepService.createStep({
        runId,
        index,
        toolName,
        input,
        startedAt: new Date(startedAt),
      });
      res.status(201).json(step);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create step" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const stepId = Number(req.params.stepId);
      const { output, error, finishedAt } = req.body;
      const step = await StepService.updateStep(stepId, {
        output,
        error,
        finishedAt: finishedAt ? new Date(finishedAt) : undefined,
      });
      res.json(step);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update step" });
    }
  },
};
