import { Router } from "express";
import { RunController } from "../controllers/runController";
import { StepController } from "../controllers/stepController";
import { MetricsController } from "../controllers/metricController";
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

// --- LIST RUNS ---
router.get("/runs", RunController.list);

// --- METRICS ---
router.get("/metrics/summary", MetricsController.summary);

export default router;
