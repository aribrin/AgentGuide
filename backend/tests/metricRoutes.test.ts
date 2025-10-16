import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/prisma/client";
import "./setupTestDB";

describe("Metrics API", () => {
  let agentId: number;
  let apiKey: string;

  beforeEach(async () => {
    // Create a test user with API key
    await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        apiKeys: "test-api-key-123",
      },
    });
    apiKey = "test-api-key-123";

    // Create a test agent
    const agent = await prisma.agent.create({
      data: { name: "Metrics Test Agent", version: "1.0" },
    });
    agentId = agent.id;
  });

  it("should return summary with zero runs", async () => {
    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey)
      .query({ agentId });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalRuns: 0,
      avgDurationMs: 0,
      totalSteps: 0,
      successRate: 0,
      avgStepsPerRun: 0,
    });
  });

  it("should calculate metrics for successful runs", async () => {
    // Create 3 successful runs with steps
    for (let i = 0; i < 3; i++) {
      const run = await prisma.run.create({
        data: {
          agentId,
          input: { prompt: `test ${i}` },
          status: "SUCCESS",
          startedAt: new Date("2025-10-15T12:00:00Z"),
          finishedAt: new Date("2025-10-15T12:00:10Z"), // 10 second duration
        },
      });

      // Add 2 steps to each run (no errors)
      await prisma.step.createMany({
        data: [
          {
            runId: run.id,
            index: 0,
            toolName: "search",
            input: {},
            startedAt: new Date(),
          },
          {
            runId: run.id,
            index: 1,
            toolName: "summarize",
            input: {},
            startedAt: new Date(),
          },
        ],
      });
    }

    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey)
      .query({ agentId });

    expect(response.status).toBe(200);
    expect(response.body.totalRuns).toBe(3);
    expect(response.body.avgDurationMs).toBe(10000); // 10 seconds in ms
    expect(response.body.totalSteps).toBe(6); // 3 runs × 2 steps
    expect(response.body.successRate).toBe(100); // No errors in any steps
    expect(response.body.avgStepsPerRun).toBe(2);
  });

  it("should calculate success rate with failures", async () => {
    // Create 2 successful runs
    for (let i = 0; i < 2; i++) {
      const run = await prisma.run.create({
        data: {
          agentId,
          input: { prompt: `success ${i}` },
          status: "SUCCESS",
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });

      await prisma.step.create({
        data: {
          runId: run.id,
          index: 0,
          toolName: "search",
          input: {},
          startedAt: new Date(),
        },
      });
    }

    // Create 1 failed run (with error in step)
    const failedRun = await prisma.run.create({
      data: {
        agentId,
        input: { prompt: "failed" },
        status: "FAILED",
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    await prisma.step.create({
      data: {
        runId: failedRun.id,
        index: 0,
        toolName: "search",
        input: {},
        error: "Connection timeout",
        startedAt: new Date(),
      },
    });

    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey)
      .query({ agentId });

    expect(response.status).toBe(200);
    expect(response.body.totalRuns).toBe(3);
    expect(response.body.successRate).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
  });

  it("should filter by date range", async () => {
    // Create run in range
    await prisma.run.create({
      data: {
        agentId,
        input: { prompt: "in range" },
        createdAt: new Date("2025-10-15T12:00:00Z"),
        startedAt: new Date(),
      },
    });

    // Create run outside range
    await prisma.run.create({
      data: {
        agentId,
        input: { prompt: "out of range" },
        createdAt: new Date("2025-10-01T12:00:00Z"),
        startedAt: new Date(),
      },
    });

    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey)
      .query({
        agentId,
        from: "2025-10-10",
        to: "2025-10-20",
      });

    expect(response.status).toBe(200);
    expect(response.body.totalRuns).toBe(1); // Only the one in range
  });

  it("should filter by agentId", async () => {
    // Create another agent
    const agent2 = await prisma.agent.create({
      data: { name: "Agent 2", version: "1.0" },
    });

    // Create run for first agent
    await prisma.run.create({
      data: {
        agentId,
        input: { prompt: "agent 1" },
        startedAt: new Date(),
      },
    });

    // Create run for second agent
    await prisma.run.create({
      data: {
        agentId: agent2.id,
        input: { prompt: "agent 2" },
        startedAt: new Date(),
      },
    });

    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey)
      .query({ agentId });

    expect(response.status).toBe(200);
    expect(response.body.totalRuns).toBe(1); // Only agent 1's run
  });

  it("should return metrics for all agents when no filter", async () => {
    // Create runs for this agent
    await prisma.run.create({
      data: {
        agentId,
        input: { prompt: "test" },
        startedAt: new Date(),
      },
    });

    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey);

    expect(response.status).toBe(200);
    expect(response.body.totalRuns).toBeGreaterThanOrEqual(1);
  });

  it("should handle runs without finished times", async () => {
    // Create pending run (no finishedAt)
    await prisma.run.create({
      data: {
        agentId,
        input: { prompt: "pending" },
        status: "PENDING",
        startedAt: new Date(),
        // No finishedAt
      },
    });

    const response = await request(app)
      .get("/v1/metrics/summary")
      .set("X-API-Key", apiKey)
      .query({ agentId });

    expect(response.status).toBe(200);
    expect(response.body.totalRuns).toBe(1);
    expect(response.body.avgDurationMs).toBe(0); // No finished runs
  });
});
