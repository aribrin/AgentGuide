import { prisma } from "../prisma/client";

async function simulate(runs = 10) {
  console.log(`🎯 Generating ${runs} runs...`);

  const agents = await prisma.agent.findMany();
  if (agents.length === 0) {
    throw new Error("No agents found. Run seed.ts first.");
  }

  for (let i = 0; i < runs; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const run = await prisma.run.create({
      data: {
        agentId: agent.id,
        input: { prompt: "Simulated run" },
        status: "RUNNING",
      },
    });

    const numSteps = Math.floor(Math.random() * 3) + 1;
    for (let s = 0; s < numSteps; s++) {
      await prisma.step.create({
        data: {
          runId: run.id,
          index: s,
          toolName: ["search", "summarize", "scrape"][s % 3],
          input: { text: "Simulated input" },
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });
    }

    await prisma.run.update({
      where: { id: run.id },
      data: { status: "SUCCESS", finishedAt: new Date() },
    });
  }

  console.log("✅ Simulation complete");
}

simulate().finally(() => prisma.$disconnect());
