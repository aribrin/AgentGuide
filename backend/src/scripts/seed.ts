import { prisma } from "../prisma/client";

async function seed() {
  console.log("🌱 Seeding database...");

  // Delete in correct order (respecting foreign key constraints)
  await prisma.artifact.deleteMany(); // Delete artifacts (depends on steps)
  await prisma.step.deleteMany();     // Delete steps (depends on runs)
  await prisma.metric.deleteMany();   // Delete metrics (depends on runs)
  await prisma.run.deleteMany();      // Delete runs (depends on agents/users)
  await prisma.user.deleteMany();     // Delete users
  await prisma.agent.deleteMany();    // Then delete agents

  const user = await prisma.user.create({
    data: { email: "demo@example.com", name: "Demo User", apiKeys: "demo-key" },
  });

  const agents = await prisma.agent.createMany({
    data: [
      { name: "SearchAgent", version: "1.0" },
      { name: "ChatAgent", version: "2.0" },
      { name: "DataAgent", version: "0.9" },
    ],
  });

  console.log(`✅ Created ${agents.count} agents and 1 user`);
  console.log("Done!");
}

seed().finally(() => prisma.$disconnect());
