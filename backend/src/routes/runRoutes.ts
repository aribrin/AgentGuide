import { Router } from "express";
import { RunController } from "../controllers/runController";
import { StepController } from "../controllers/stepController";
import { validateBody } from "../middleware/validateRequest";
import {
  createRunSchema,
  createStepSchema,
  updateStepSchema,
} from "../validation/runSchemas";

const router = Router();

// --- RUNS ---
router.post("/runs", validateBody(createRunSchema), RunController.create);
router.get("/runs/:runId", RunController.getOne);

// --- STEPS ---
router.post(
  "/runs/:runId/steps",
  validateBody(createStepSchema),
  StepController.create
);
router.patch(
  "/runs/:runId/steps/:stepId",
  validateBody(updateStepSchema),
  StepController.update
);

export default router;
