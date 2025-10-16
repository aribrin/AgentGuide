import { prisma } from "../prisma/client";

async function seed() {
  console.log("🌱 Seeding database...");

  // Delete in correct order (respecting foreign key constraints)
  await prisma.run.deleteMany();      // Delete runs first
  await prisma.user.deleteMany();     // Delete users
  await prisma.agent.deleteMany();    // Then delete agents

  const user = await prisma.user.create({
    data: { email: "demo@example.com", name: "Demo User" },
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
