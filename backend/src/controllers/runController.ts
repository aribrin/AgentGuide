import { Request, Response } from "express";
import { RunService } from "../services/runService";
import { listRunsQuerySchema } from "../validation/querySchemas";

export const RunController = {
  async create(req: Request, res: Response) {
    try {
      const { agentId, input } = req.body;
      const user = (req as any).user; // set by authenticateApiKey middleware

      const run = await RunService.createRun({
        agentId,
        userId: user?.id, // automatically associate the run with the authenticated user
        input,
      });
      console.log("Authenticated user:", (req as any).user);

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
      if (!run) return res.status(404).json({ error: "Run not found" });
      return res.json(run);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch run" });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const parseResult = listRunsQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: parseResult.error.issues,
        });
      }

      const { agentId, status, limit, offset } = parseResult.data;

      const runs = await RunService.listRuns({
        agentId,
        status,
        limit,
        offset,
      });

      return res.json(runs);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to list runs" });
    }
  },



  
};
