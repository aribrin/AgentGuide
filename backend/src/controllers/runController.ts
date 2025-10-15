import { Request, Response } from "express";
import { RunService } from "../services/runService";

export const RunController = {
  async create(req: Request, res: Response) {
    try {
      const { agentId, userId, input } = req.body;
      const run = await RunService.createRun({ agentId, userId, input });
      res.status(201).json(run);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create run" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const runId = Number(req.params.runId);
      const run = await RunService.getRun(runId);
      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }
      return res.json(run);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch run" });
    }
  },
};
