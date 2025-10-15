import { Request, Response } from "express";
import { RunService } from "../services/runService";
import { createRunSchema } from "../validation/runSchemas";

export const RunController = {
  async create(req: Request, res: Response) {
    try {
      const parsed = createRunSchema.parse(req.body);
      const run = await RunService.createRun(parsed);
      return res.status(201).json(run);
    } catch (err) {
      if (err instanceof Error && "issues" in (err as any)) {
        // Zod validation error
        return res.status(400).json({ error: "Invalid input", details: (err as any).issues });
      }
      console.error(err);
      return res.status(500).json({ error: "Failed to create run" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const runId = Number(req.params.runId);
      const run = await RunService.getRun(runId);
      if (!run) return res.status(404).json({ error: "Run not found" });
      return res.json(run);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch run" });
    }
  },
};
