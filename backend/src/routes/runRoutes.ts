import { Router } from "express";
import { RunController } from "../controllers/runController";
import { StepController } from "../controllers/stepController";

const router = Router();

router.post("/runs", RunController.create);
router.get("/runs/:runId", RunController.getOne);
router.post("/runs/:runId/steps", StepController.create);
router.patch("/runs/:runId/steps/:stepId", StepController.update);

export default router;
