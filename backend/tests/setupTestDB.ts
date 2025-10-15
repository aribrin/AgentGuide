import { prisma } from "../src/prisma/client";

/**
 * Jest setup: clean test database before each test suite,
 * and insert a baseline Agent record.
 */
beforeEach(async () => {
  // Clear all public tables
  const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public';
  `;

  for (const { tablename } of tableNames) {
    if (tablename !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
    }
  }

  // ✅ Seed at least one agent, since tests use agentId: 1
  await prisma.agent.create({
    data: {
      name: "Test Agent",
      version: "1.0",
      description: "Auto-seeded test agent",
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
