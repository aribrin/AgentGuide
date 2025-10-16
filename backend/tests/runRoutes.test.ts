import request from "supertest";
import app from "../src/app";
import prisma from "../src/prisma/client";
import "./setupTestDB";

describe("Run API", () => {
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
  });
  it("should create a new run successfully", async () => {
    const response = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "hello" } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.agentId).toBe(1);
    expect(response.body.status).toBe("PENDING");
  });

  it("should fail validation when missing input", async () => {
    const response = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid input");
  });

  it("should fetch a run by id", async () => {
    const createRes = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "test" } });

    const runId = createRes.body.id;

    const getRes = await request(app)
      .get(`/v1/runs/${runId}`)
      .set("X-API-Key", apiKey);

    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty("id", runId);
    expect(getRes.body).toHaveProperty("agent");
  });

  it("should update a run status to SUCCESS", async () => {
    const createRes = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "test" } });

    const runId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/v1/runs/${runId}`)
      .set("X-API-Key", apiKey)
      .send({
        status: "SUCCESS",
        output: { result: "completed" },
        finishedAt: "2025-10-15T18:00:00Z",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("SUCCESS");
    expect(updateRes.body.output).toEqual({ result: "completed" });
    expect(updateRes.body.finishedAt).toBeTruthy();
  });

  it("should update run with partial fields", async () => {
    const createRes = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "test" } });

    const runId = createRes.body.id;

    // Update only status
    const updateRes = await request(app)
      .patch(`/v1/runs/${runId}`)
      .set("X-API-Key", apiKey)
      .send({ status: "RUNNING" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("RUNNING");
    expect(updateRes.body.output).toBeNull(); // Should remain unchanged
  });

  it("should return 404 when updating non-existent run", async () => {
    const response = await request(app)
      .patch("/v1/runs/99999")
      .set("X-API-Key", apiKey)
      .send({ status: "SUCCESS" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Run not found");
  });

  it("should list runs with filtering", async () => {
    // Create multiple runs
    await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "run1" } });

    await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "run2" } });

    const listRes = await request(app)
      .get("/v1/runs")
      .set("X-API-Key", apiKey)
      .query({ agentId: 1, limit: 10 });

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should reject invalid status in update", async () => {
    const createRes = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { prompt: "test" } });

    const runId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/v1/runs/${runId}`)
      .set("X-API-Key", apiKey)
      .send({ status: "INVALID_STATUS" });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error).toBe("Invalid input");
  });

  it("should complete full workflow: create → add steps → mark success", async () => {
    // 1. Create run
    const createRes = await request(app)
      .post("/v1/runs")
      .set("X-API-Key", apiKey)
      .send({ agentId: 1, input: { task: "workflow test" } });

    const runId = createRes.body.id;

    // 2. Add a step
    const stepRes = await request(app)
      .post(`/v1/runs/${runId}/steps`)
      .set("X-API-Key", apiKey)
      .send({
        index: 0,
        toolName: "search",
        input: { query: "test" },
        startedAt: "2025-10-15T12:00:00Z",
      });

    expect(stepRes.status).toBe(201);

    // 3. Complete the step
    const stepId = stepRes.body.id;
    await request(app)
      .patch(`/v1/runs/${runId}/steps/${stepId}`)
      .set("X-API-Key", apiKey)
      .send({
        output: { results: ["item1"] },
        finishedAt: "2025-10-15T12:00:05Z",
      });

    // 4. Mark run as complete
    const finalRes = await request(app)
      .patch(`/v1/runs/${runId}`)
      .set("X-API-Key", apiKey)
      .send({
        status: "SUCCESS",
        output: { summary: "Found 1 result" },
        finishedAt: "2025-10-15T12:00:10Z",
      });

    expect(finalRes.status).toBe(200);
    expect(finalRes.body.status).toBe("SUCCESS");

    // 5. Verify complete trace
    const getRes = await request(app)
      .get(`/v1/runs/${runId}`)
      .set("X-API-Key", apiKey);

    expect(getRes.body.steps).toHaveLength(1);
    expect(getRes.body.steps[0].toolName).toBe("search");
    expect(getRes.body.steps[0].output).toEqual({ results: ["item1"] });
  });
});
