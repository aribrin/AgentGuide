import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/prisma/client";
import "./setupTestDB"; // Ensures DB reset + seed before each test

describe("Step API", () => {
  let runId: number;
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

    // Create a run for the seeded agent
    const run = await prisma.run.create({
      data: {
        agentId: 1,
        input: { prompt: "testing steps" },
      },
    });
    runId = run.id;
  });

  it("should create a step for a run", async () => {
    const response = await request(app)
      .post(`/v1/runs/${runId}/steps`)
      .set("X-API-Key", apiKey)
      .send({
        index: 0,
        toolName: "search",
        input: { q: "example" },
        startedAt: "2025-10-15T12:00:00Z",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.runId).toBe(runId);
    expect(response.body.toolName).toBe("search");
  });

  it("should update a step's output", async () => {
    const step = await prisma.step.create({
      data: {
        runId,
        index: 1,
        toolName: "browser",
        input: { url: "example.com" },
        startedAt: new Date(),
      },
    });

    const patchRes = await request(app)
      .patch(`/v1/runs/${runId}/steps/${step.id}`)
      .set("X-API-Key", apiKey)
      .send({
        output: { result: "ok" },
        finishedAt: "2025-10-15T12:01:00Z",
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.output).toEqual({ result: "ok" });
    expect(patchRes.body.finishedAt).toBeTruthy();
  });

  it("should return 400 for invalid step data", async () => {
    const response = await request(app)
      .post(`/v1/runs/${runId}/steps`)
      .set("X-API-Key", apiKey)
      .send({
        toolName: "", // invalid
        input: {}, // missing index/start time
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid input");
  });
});
