import { Request, Response } from "express";
import { MetricsService } from "../services/metricsService";

export const MetricsController = {
  async summary(req: Request, res: Response) {
    try {
      // Use validated query data from middleware
      const validatedQuery = (req as any).validatedQuery || {};
      const { agentId, from, to } = validatedQuery;
      const summary = await MetricsService.getSummary(
        agentId,
        from,
        to
      );
      res.json(summary);
    } catch (err) {
      console.error("Error in metrics summary:", err);
      res.status(500).json({ error: "Failed to compute metrics" });
    }
  },
};
