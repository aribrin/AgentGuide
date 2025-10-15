import { Router } from "express";
import { getAgents, createAgent } from "../controllers/agentController";

const router = Router();

router.get("/", getAgents);
router.post("/", createAgent); 

export default router;