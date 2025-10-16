import { Request, Response } from "express";
import { MetricsService } from "../services/metricsService";

export const MetricsController = {
  async summary(req: Request, res: Response) {
    try {
      const { agentId, from, to } = req.query;
      const summary = await MetricsService.getSummary(
        agentId ? Number(agentId) : undefined,
        from ? String(from) : undefined,
        to ? String(to) : undefined
      );
      res.json(summary);
    } catch (err) {
      console.error("Error in metrics summary:", err);
      res.status(500).json({ error: "Failed to compute metrics" });
    }
  },
};
