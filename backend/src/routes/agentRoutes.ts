import { Router } from "express";
import { getAllAgents, createAgent } from "../controllers/agentController";

const router = Router();

router.get("/", getAllAgents);
router.post("/", createAgent); 

export default router;