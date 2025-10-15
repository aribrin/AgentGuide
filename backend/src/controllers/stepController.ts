import { Request, Response } from "express";
import { StepService } from "../services/stepService";

export const StepController = {
  async create(req: Request, res: Response) {
    try {
      const runId = Number(req.params.runId);
      const step = await StepService.createStep({ ...req.body, runId });
      res.status(201).json(step);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create step" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const stepId = Number(req.params.stepId);
      const step = await StepService.updateStep(stepId, req.body);
      res.json(step);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update step" });
    }
  },
};
