import request from "supertest";
import app from "../src/app";
import prisma from "../src/prisma/client";

beforeAll(async () => {
  // optional: seed an agent for reference
  await prisma.agent.create({
    data: { name: "Test Agent", version: "1.0" },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Run API", () => {
  it("should create a new run successfully", async () => {
    const response = await request(app)
      .post("/v1/runs")
      .send({ agentId: 1, input: { prompt: "hello" } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.agentId).toBe(1);
    expect(response.body.status).toBe("PENDING");
  });

  it("should fail validation when missing input", async () => {
    const response = await request(app)
      .post("/v1/runs")
      .send({ agentId: 1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid input");
  });

  it("should fetch a run by id", async () => {
    const createRes = await request(app)
      .post("/v1/runs")
      .send({ agentId: 1, input: { prompt: "test" } });

    const runId = createRes.body.id;

    const getRes = await request(app).get(`/v1/runs/${runId}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveProperty("id", runId);
    expect(getRes.body).toHaveProperty("agent");
  });
});
