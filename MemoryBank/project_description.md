!!!!DO NOT CHANGE THIS FILE.!!!


# AgentGuide — Step-by-Step Plan (Build, Test, and Demo)

  Below is a concrete, actionable plan from skeleton → production-ready demo, with schemas, endpoints, testing strategies, example queries, and what to show on your resume.

## 1) Project Summary (Elevator Pitch)

**AgentGuide** is a lightweight monitoring & tracing backend for agentic workflows. It ingests runs from agents (inputs, step-by-step tool calls, outputs, errors, and metrics), stores them in PostgreSQL, exposes REST/GraphQL APIs for querying runs and aggregates, and provides a small UI to inspect traces and KPIs (latency, success rate, common errors).

## 2) Tech Choices & Structure

- **Backend:** Node.js + TypeScript, Express (or Fastify)
- **ORM:** Prisma (excellent DX, types + migrations)
- **DB:** PostgreSQL (hosted locally via Docker for dev; managed for prod)
- **Queue (optional):** BullMQ + Redis for ingest backpressure
- **Auth (optional):** JWT + simple user table
- **Tests:** Jest + Supertest for routes, integration tests using a Dockerized Postgres test database
- **Frontend (optional demo UI):** React + Next.js for trace viewer
- **Deployment:** Docker Compose for local dev; GitHub Actions → ECS/Fargate or Heroku/Vercel for demo
- **Observability:** Prometheus/Grafana (optional) or simple metrics stored in DB

**Project layout:**

```
agentguide/
  ├─ backend/
  │   ├─ src/
  │   │  ├─ controllers/
  │   │  ├─ services/
  │   │  ├─ routes/
  │   │  ├─ prisma/
  │   │  ├─ app.ts
  │   │  └─ server.ts
  │   ├─ prisma/schema.prisma
  │   ├─ Dockerfile
  │   └─ package.json
  ├─ frontend/ (optional)
  ├─ docker-compose.yml
  └─ README.md
```

## 3) Database Schema (Prisma + SQL)

Normalized model covering runs, steps, artifacts, tools, metrics, and users.

**Prisma schema (core models)** — drop this into `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String?
  apiKey    String? @unique
  createdAt DateTime @default(now())
  runs      Run[]
}

model Agent {
  id          Int     @id @default(autoincrement())
  name        String
  version     String?
  description String?
  runs        Run[]
}

model Run {
  id            Int       @id @default(autoincrement())
  agent         Agent     @relation(fields: [agentId], references: [id])
  agentId       Int
  user          User?     @relation(fields: [userId], references: [id])
  userId        Int?
  status        RunStatus @default(PENDING)
  input         Json
  output        Json?
  startedAt     DateTime  @default(now())
  finishedAt    DateTime?
  steps         Step[]
  metrics       Metric[]
  createdAt     DateTime  @default(now())
}

model Step {
  id          Int       @id @default(autoincrement())
  run         Run       @relation(fields: [runId], references: [id])
  runId       Int
  index       Int
  toolName    String
  input       Json
  output      Json?
  error       String?
  startedAt   DateTime
  finishedAt  DateTime?
  artifacts   Artifact[]
}

model Artifact {
  id        Int    @id @default(autoincrement())
  step      Step   @relation(fields: [stepId], references: [id])
  stepId    Int
  type      String
  url       String?
  content   Json?
}

model Metric {
  id     Int    @id @default(autoincrement())
  run    Run    @relation(fields: [runId], references: [id])
  runId  Int
  name   String
  value  Float
  tags   Json?
}

enum RunStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
}
```

**Notes:**

- Use `Json` for flexible payloads (agent inputs/outputs)
- Index the `startedAt`, `finishedAt`, and `agentId` for efficient queries. Add Prisma index attributes or raw SQL migration as needed

## 4) API Design (REST Endpoints)

Start with REST; you can add GraphQL later.

### Ingest

- `POST /v1/runs` — create new run (body: agentId/userId/input). Returns run id
- `POST /v1/runs/:runId/steps` — append a step (toolName, index, input, startedAt)
- `PATCH /v1/runs/:runId/steps/:stepId` — update step output/error/finishedAt
- `PATCH /v1/runs/:runId` — update run status, finishedAt, output, metrics

### Query / Inspect

- `GET /v1/runs/:runId` — full trace (run + steps + artifacts + metrics)
- `GET /v1/runs?agentId=&status=&limit=&offset=` — list runs
- `GET /v1/agents` — list agents
- `GET /v1/metrics/summary?agentId=&from=&to=` — KPI aggregates

### Admin / Debug

- `POST /v1/simulate` — endpoint that runs a simulated agent for demo/testing

## 5) Implementation Plan — Iterative Steps

Week-by-week breakdown (you can compress or expand depending on time).

### Phase A — MVP (1–2 weeks)

1. Init repository, TypeScript + Node + ESLint + Prettier
2. Add Prisma, create `schema.prisma`, generate client
3. Implement DB migrations and Docker Compose (Postgres service)
4. Implement core services:
   - `RunService`: createRun, updateRun, getRun
   - `StepService`: createStep, updateStep
5. Implement controllers/routes for the ingest and query endpoints
6. Add basic validation (zod or Joi)
7. Dockerize backend

### Phase B — Testing & Demo Data (1 week)

1. Add seed script to create sample Agents and Users
2. Add a simulate command that creates synthetic runs with multiple steps and random latencies/errors — great for demo data
3. Implement unit tests for services
4. Add integration tests (spin up test Postgres, run migrations, test endpoints with Supertest)

### Phase C — Dashboard & Aggregates (1 week)

1. Build a small Next.js dashboard to visualize traces and metrics OR use a simple React app
2. Implement metrics endpoints: average latency, success rate, top failing tools, step counts
3. Add sample charts (e.g., runs per hour, avg step duration)

### Phase D — Production Polish (1 week)

1. Add auth (API key per user) for ingest endpoints
2. Add rate limiting and optional Redis-backed queue for ingestion
3. Add logging & error tracking (Sentry or simple logs)
4. Add GitHub Actions for CI (run tests + build + push Docker image)
5. Deploy a demo on a cheap host (Heroku/AWS ECS Fargate or Railway)

## 6) Test Strategy (Unit, Integration, Load) & Example Tests

### Unit Tests

- Test `RunService.createRun()` writes correct fields, default status, timestamps
- Test `StepService.createStep()` increments step index and associates with run

**Example Jest test (unit):**

```typescript
// tests/run.service.spec.ts
import { prisma } from '../src/prisma/client';
import { RunService } from '../src/services/run.service';

describe('RunService', () => {
  beforeAll(async () => { /* start test db / run migrations */ });
  afterAll(async () => { await prisma.$disconnect(); });

  it('creates a run', async () => {
    const run = await RunService.createRun({ agentId: 1, input: { prompt: 'hey' }});
    expect(run.id).toBeDefined();
    expect(run.status).toBe('PENDING');
    expect(run.input).toMatchObject({ prompt: 'hey' });
  });
});
```

### Integration Tests (Supertest)

Start a test DB (Docker Compose), run migrations, spin up the app, call endpoints end-to-end.

**Example Supertest:**

```typescript
import request from 'supertest';
import app from '../src/app';

test('create run and add step', async () => {
  const r = await request(app).post('/v1/runs').send({ agentId: 1, input: {} });
  expect(r.status).toBe(201);
  const step = await request(app).post(`/v1/runs/${r.body.id}/steps`).send({ toolName: 'wiki', index: 0, input: {} });
  expect(step.status).toBe(201);
});
```

### Load / Stress Testing (Demo)

- Use k6 or wrk to simulate many concurrent run ingests to show DB and API behavior
- Measure p95 and p99 latencies for step creation

### End-to-End Demo Tests

Script that runs simulate endpoint to generate 100 runs, then fetch KPI endpoints and assert success rate > X or compute averages.

## 7) Demonstrating Results for Interviews / Portfolio

Create a short reproducible demo script + artifacts to show.

**Deliverables to include in repo/demo:**

- `docker-compose.yml` — brings up Postgres + backend + (optional) frontend
- `scripts/seed.ts` — populates Agents + Users
- `scripts/simulate.ts` — generates N runs with realistic step timings and random errors
- `postman_collection.json` or httpie/curl snippets for these flows
- `demo-recording.mp4` (30–90s) — screen capture of:
  - Run the simulate script
  - Open dashboard: show a run trace, step-by-step outputs and any errors
  - Show KPI endpoints with SQL queries (below) and charts (e.g., success rate, avg step latency)
- README with "How to run the demo in 5 minutes" and expected outputs

### Example curl Demo Sequence

```bash
# create run
curl -X POST http://localhost:3001/v1/runs -H "Content-Type: application/json" -d '{"agentId":1, "input":{"prompt":"fetch facts"}}'

# add step
curl -X POST http://localhost:3001/v1/runs/1/steps -d '{"toolName":"search","index":0,"input":{"q":"climate data"}}'

# finalize step
curl -X PATCH http://localhost:3001/v1/runs/1/steps/1 -d '{"output":{"results": []}, "finishedAt":"2025-10-12T12:34:00Z"}'

# mark run success
curl -X PATCH http://localhost:3001/v1/runs/1 -d '{"status":"SUCCESS", "finishedAt":"2025-10-12T12:35:00Z"}'
```

## 8) Useful SQL Queries for Metrics & Example Outputs

Run these against Postgres to produce demo metrics.

### Average Run Duration (Per Agent)

```sql
SELECT a.name, AVG(EXTRACT(EPOCH FROM (r.finishedAt - r.startedAt))) AS avg_seconds
FROM "Run" r
JOIN "Agent" a ON a.id = r.agentId
WHERE r.status = 'SUCCESS' AND r.finishedAt IS NOT NULL
GROUP BY a.name;
```

### Top 5 Failing Tools

```sql
SELECT s.toolName, COUNT(*) AS failures
FROM "Step" s
WHERE s.error IS NOT NULL
GROUP BY s.toolName
ORDER BY failures DESC
LIMIT 5;
```

### Success Rate (Last 24h)

```sql
SELECT
  SUM(CASE WHEN status='SUCCESS' THEN 1 ELSE 0 END)::float / COUNT(*) AS success_rate
FROM "Run"
WHERE createdAt >= now() - interval '24 hours';
```

### P95 Step Duration for a Tool

```sql
SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (finishedAt - startedAt))) AS p95
FROM "Step"
WHERE toolName = 'search' AND finishedAt IS NOT NULL;
```

Show these queries in your demo and plot results to emphasize the value.

## 9) How to Test Correctness / Show Reliability

- Unit coverage via Jest → aim for 70–90% for service layer
- Integration tests validate actual DB constraints and query correctness
- End-to-end scenario tests: simulate 100 runs → assert KPI endpoints return expected numbers
- Mutation tests / failure injection: simulate failing step (throw error) and assert run marked FAILED and error stored
- Load test: simulate 200 requests/s to step ingestion and record p95 latency; show results in README or demo to show scalability thinking

## 10) CI/CD & Repo Hygiene (Short Checklist)

### GitHub Actions

- **job test:** install deps, start postgres (service), run migrations, run tests
- **job build-and-push:** build Docker image and push to registry on main
- Dockerfile for backend + docker-compose.yml for dev
- ENV config via `.env.example`
- README with badges, run instructions, and demo steps

**Example GH Actions job snippet (conceptual):**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: node-version: 20
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm test
```

## 11) Demo Script (What You Will Run Live)

1. `docker-compose up --build` (starts Postgres + backend)
2. Run `node ./dist/scripts/seed.js` to create demo Agents/Users
3. Run `node ./dist/scripts/simulate.js --runs=50 --error-rate=0.1` to generate data
4. Visit dashboard: open a run, show timeline and step details (input/output/error)
5. Run SQL metric queries and show the numbers + one chart (avg latency & success rate)
6. Show integration test results in CI badge (if deployed)

Record these steps; a short 60–90s screen recording + README is enough for a portfolio/demo link.

## 12) Example Resume Bullets (Pick a Few)

- Designed and implemented **AgentGuide**, a Node.js + PostgreSQL observability backend for agentic workflows; authored normalized run/step schema and API for trace-level debugging and metrics
- Built ingestion, query, and aggregation APIs, implemented automated integration tests and CI pipeline, and deployed a demo using Docker + GitHub Actions
- Implemented a demo load test and dashboard that surfaced top error-causing tools and reduced triage time in a recorded demo

## 13) Optional Stretch / Highlights to Show Advanced Skills

- Add `pgvector` column for embedding step outputs and vector search for similar past runs
- Add tracing integration (OpenTelemetry) to propagate trace ids
- Add alerting rules (e.g., runs failing > X% in last hour) and webhook notifications
- Expose a small GraphQL schema for flexible queries

## 14) Quick Checklist to Start Coding (Copy-Paste)

```bash
mkdir agentguide && cd agentguide && git init
mkdir backend && cd backend
npm init -y && npm i express prisma @prisma/client typescript ts-node-dev zod
npx prisma init
# → paste schema.prisma above → set DATABASE_URL in .env
npx prisma migrate dev --name init
# Implement RunService + StepService + routes and tests
# Create docker-compose.yml with Postgres and run
```
