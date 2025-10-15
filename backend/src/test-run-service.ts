import { RunService } from "./services/runService";
import { StepService } from "./services/stepService";
import prisma from "./prisma/client";

async function main() {
  const run = await RunService.createRun({
    agentId: 1,
    input: { prompt: "Hello world" },
  });
  console.log("Created Run:", run);

  const step = await StepService.createStep({
    runId: run.id,
    index: 0,
    toolName: "search",
    input: { q: "Node.js architecture" },
    startedAt: new Date(),
  });
  console.log("Created Step:", step);

  const fullRun = await RunService.getRun(run.id);
  console.log("Fetched Run with steps:", JSON.stringify(fullRun, null, 2));
}

main().finally(() => prisma.$disconnect());
