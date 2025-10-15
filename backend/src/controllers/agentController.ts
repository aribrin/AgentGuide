import { Request, Response } from "express";
import { agentService } from "../services/agentService";

export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const agents = await agentService.getAllAgents();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch agents" });
  }
};

export const createAgent = async (req: Request, res: Response) => {
  try {
    const agent = await agentService.createAgent(req.body);
    res.status(201).json(agent);
  } catch (err) {
    res.status(400).json({ error: "Failed to create agent" });
  }
};
