import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/prisma/client";
import "./setupTestDB";

describe("Authentication", () => {
  let validApiKey: string;
  let userId: number;

  beforeEach(async () => {
    // Create a user with an API key
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        apiKeys: "test-api-key-123",
      },
    });
    userId = user.id;
    validApiKey = "test-api-key-123";

    // Create an agent for testing
    await prisma.agent.create({
      data: { name: "Auth Test Agent", version: "1.0" },
    });
  });

  describe("Protected Endpoints", () => {
    it("should allow access with valid API key", async () => {
      const response = await request(app)
        .post("/v1/runs")
        .set("X-API-Key", validApiKey)
        .send({ agentId: 1, input: { prompt: "test" } });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
    });

    it("should reject request without API key", async () => {
      const response = await request(app)
        .post("/v1/runs")
        .send({ agentId: 1, input: { prompt: "test" } });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("API key is required");
    });

    it("should reject request with invalid API key", async () => {
      const response = await request(app)
        .post("/v1/runs")
        .set("X-API-Key", "invalid-key")
        .send({ agentId: 1, input: { prompt: "test" } });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid API key");
    });

    it("should associate run with authenticated user", async () => {
      const response = await request(app)
        .post("/v1/runs")
        .set("X-API-Key", validApiKey)
        .send({ agentId: 1, input: { prompt: "test" } });

      expect(response.status).toBe(201);

      // Verify the run is associated with the user
      const run = await prisma.run.findUnique({
        where: { id: response.body.id },
      });

      expect(run?.userId).toBe(userId);
    });
  });

  describe("Public Endpoints", () => {
    it("should allow access to /agents without API key", async () => {
      const response = await request(app).get("/agents");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("All Protected Endpoints Require Auth", () => {
    it("POST /v1/runs requires auth", async () => {
      const response = await request(app)
        .post("/v1/runs")
        .send({ agentId: 1, input: {} });

      expect(response.status).toBe(401);
    });

    it("GET /v1/runs/:runId requires auth", async () => {
      const response = await request(app).get("/v1/runs/1");

      expect(response.status).toBe(401);
    });

    it("PATCH /v1/runs/:runId requires auth", async () => {
      const response = await request(app)
        .patch("/v1/runs/1")
        .send({ status: "SUCCESS" });

      expect(response.status).toBe(401);
    });

    it("POST /v1/runs/:runId/steps requires auth", async () => {
      const response = await request(app)
        .post("/v1/runs/1/steps")
        .send({
          index: 0,
          toolName: "test",
          input: {},
          startedAt: new Date(),
        });

      expect(response.status).toBe(401);
    });

    it("PATCH /v1/runs/:runId/steps/:stepId requires auth", async () => {
      const response = await request(app)
        .patch("/v1/runs/1/steps/1")
        .send({ output: {} });

      expect(response.status).toBe(401);
    });

    it("GET /v1/runs requires auth", async () => {
      const response = await request(app).get("/v1/runs");

      expect(response.status).toBe(401);
    });

    it("GET /v1/metrics/summary requires auth", async () => {
      const response = await request(app).get("/v1/metrics/summary");

      expect(response.status).toBe(401);
    });
  });
});

describe("Error Handling", () => {
  beforeEach(async () => {
    // Create user and agent for tests
    await prisma.user.create({
      data: {
        email: "error-test@example.com",
        apiKeys: "error-test-key",
      },
    });

    await prisma.agent.create({
      data: { name: "Error Test Agent", version: "1.0" },
    });
  });

  it("should return 404 for non-existent run", async () => {
    const response = await request(app)
      .get("/v1/runs/99999")
      .set("X-API-Key", "error-test-key");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Run not found");
  });

  it("should return 404 for non-existent step", async () => {
    // Create a run first
    const run = await prisma.run.create({
      data: {
        agentId: 1,
        input: { prompt: "test" },
      },
    });

    const response = await request(app)
      .patch(`/v1/runs/${run.id}/steps/99999`)
      .set("X-API-Key", "error-test-key")
      .send({ output: {} });

    expect(response.status).toBe(404);
  });

  it("should validate required fields on run creation", async () => {
    const response = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", "error-test-key")
      .send({ agentId: 1 }); // Missing required 'input' field

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid input");
  });

  it("should validate required fields on step creation", async () => {
    const run = await prisma.run.create({
      data: {
        agentId: 1,
        input: { prompt: "test" },
      },
    });

    const response = await request(app)
      .post(`/v1/runs/${run.id}/steps`)
      .set("X-API-Key", "error-test-key")
      .send({ toolName: "test" }); // Missing index, input, startedAt

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid input");
  });

  it("should reject invalid enum values", async () => {
    const run = await prisma.run.create({
      data: {
        agentId: 1,
        input: { prompt: "test" },
      },
    });

    const response = await request(app)
      .patch(`/v1/runs/${run.id}`)
      .set("X-API-Key", "error-test-key")
      .send({ status: "INVALID_STATUS" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid input");
  });

  it("should handle malformed JSON", async () => {
    const response = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", "error-test-key")
      .set("Content-Type", "application/json")
      .send("{ invalid json }");

    expect(response.status).toBe(400);
  });
});
