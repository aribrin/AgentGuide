# AgentGuide 🤖📊

A lightweight monitoring and tracing backend for agentic workflows. AgentGuide ingests runs from AI agents (inputs, step-by-step tool calls, outputs, errors, and metrics), stores them in PostgreSQL, and exposes REST APIs for querying traces and aggregated KPIs.

**Perfect for:** Debugging agent failures, analyzing performance bottlenecks, tracking success rates, and understanding tool usage patterns.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local development)

### 1. Clone and Start

```bash
git clone <your-repo-url>
cd AgentGuide

# Start PostgreSQL + Backend
docker-compose up --build -d

# Wait for services to be ready (~30 seconds)
docker-compose logs -f backend
```

The API will be available at `http://localhost:3000`

### 2. Seed Demo Data

```bash
cd backend
npm install
npm run prisma:generate

# Create sample agents and users
npx ts-node src/scripts/seed.ts

# Generate 50 sample runs with steps
npx ts-node src/scripts/simulate.ts
```

### 3. Query the API

```bash
# List all runs
curl http://localhost:3001/v1/runs

# Get a specific run with all steps
curl http://localhost:3001/v1/runs/1

# Get metrics summary
curl http://localhost:3001/v1/metrics/summary
```

---

## 📚 API Documentation

### Authentication
Protected endpoints require an API key header:
```bash
X-API-Key: <user-api-key>
```

### Endpoints

#### **Create Run**
```bash
POST /v1/runs
Content-Type: application/json
X-API-Key: <your-api-key>

{
  "agentId": 1,
  "input": { "prompt": "Fetch climate data" }
}

# Response: 201 Created
{
  "id": 1,
  "agentId": 1,
  "status": "PENDING",
  "input": { "prompt": "Fetch climate data" },
  "startedAt": "2025-10-15T18:00:00Z",
  ...
}
```

#### **Add Step to Run**
```bash
POST /v1/runs/:runId/steps
Content-Type: application/json
X-API-Key: <your-api-key>

{
  "index": 0,
  "toolName": "web_search",
  "input": { "query": "climate data 2025" },
  "startedAt": "2025-10-15T18:00:01Z"
}
```

#### **Update Step (Mark Complete)**
```bash
PATCH /v1/runs/:runId/steps/:stepId
Content-Type: application/json
X-API-Key: <your-api-key>

{
  "output": { "results": [...] },
  "finishedAt": "2025-10-15T18:00:05Z"
}
```

#### **Update Run (Mark Complete)**
```bash
PATCH /v1/runs/:runId
Content-Type: application/json
X-API-Key: <your-api-key>

{
  "status": "SUCCESS",
  "output": { "summary": "Found 10 results" },
  "finishedAt": "2025-10-15T18:00:10Z"
}
```

#### **Get Run Details**
```bash
GET /v1/runs/:runId
X-API-Key: <your-api-key>

# Returns run with all steps, artifacts, and metrics
```

#### **List Runs**
```bash
GET /v1/runs?agentId=1&status=SUCCESS&limit=10&offset=0
X-API-Key: <your-api-key>
```

#### **Get Metrics Summary**
```bash
GET /v1/metrics/summary?agentId=1&from=2025-10-01&to=2025-10-15
X-API-Key: <your-api-key>

# Response:
{
  "totalRuns": 50,
  "avgDurationMs": 2340,
  "totalSteps": 125,
  "successRate": 94.5,
  "avgStepsPerRun": 2.5
}
```

#### **List Agents**
```bash
GET /agents

# Public endpoint - no auth required
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   AI Agent      │
│  (Your Code)    │
└────────┬────────┘
         │ HTTP POST/PATCH
         ▼
┌─────────────────┐
│  AgentGuide API │
│   (Express)     │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

### Database Schema

- **User**: API keys for authentication
- **Agent**: Different agent types (SearchAgent, ChatAgent, etc.)
- **Run**: Individual agent execution (input, output, status, timestamps)
- **Step**: Individual tool calls within a run (toolName, input, output, error)
- **Artifact**: Attachments from steps (screenshots, files, etc.)
- **Metric**: Custom metrics attached to runs

---

## 🛠️ Development Setup

### Local Development (without Docker)

1. **Start PostgreSQL**
   ```bash
   docker run -d \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=agentguide \
     -p 5432:5432 \
     postgres:15-alpine
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Copy environment template
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   
   # Run migrations
   npm run prisma:migrate
   
   # Generate Prisma Client
   npm run prisma:generate
   
   # Start dev server (with hot reload)
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

---

## 🧪 Testing

### Run All Tests
```bash
cd backend
npm test
```

### Test Structure
- **Integration Tests**: `backend/tests/runRoutes.test.ts`, `backend/tests/stepRoutes.test.ts`
- **Setup**: `backend/tests/setupTestDB.ts` (test database configuration)

### Writing Tests
Tests use Jest + Supertest for API testing:
```typescript
test('should create a run', async () => {
  const response = await request(app)
    .post('/v1/runs')
    .set('X-API-Key', 'test-key')
    .send({ agentId: 1, input: { prompt: 'test' } });
  
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

---

## 📊 Example Workflow

Here's a complete example of tracking an agent run:

```bash
# 1. Create a run
RUN_ID=$(curl -s -X POST http://localhost:3000/v1/runs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key" \
  -d '{
    "agentId": 1,
    "input": {"task": "Research AI trends"}
  }' | jq -r '.id')

# 2. Add first step (web search)
STEP1_ID=$(curl -s -X POST http://localhost:3000/v1/runs/$RUN_ID/steps \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key" \
  -d '{
    "index": 0,
    "toolName": "web_search",
    "input": {"query": "AI trends 2025"},
    "startedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }' | jq -r '.id')

# 3. Complete the step
curl -X PATCH http://localhost:3000/v1/runs/$RUN_ID/steps/$STEP1_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key" \
  -d '{
    "output": {"results": ["Article 1", "Article 2"]},
    "finishedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# 4. Mark run as complete
curl -X PATCH http://localhost:3000/v1/runs/$RUN_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo-key" \
  -d '{
    "status": "SUCCESS",
    "output": {"summary": "Found 2 trending topics"},
    "finishedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# 5. View the complete trace
curl http://localhost:3000/v1/runs/$RUN_ID \
  -H "X-API-Key: demo-key" | jq
```

---


## 🚀 Tech Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma (type-safe database access)
- **Validation**: Zod (runtime type checking)
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose

---

## 📦 Project Structure

```
AgentGuide/
├── backend/
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Auth, validation
│   │   ├── validation/      # Zod schemas
│   │   ├── prisma/          # Prisma client
│   │   └── scripts/         # Seed & simulate
│   ├── tests/               # Integration tests
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🎓 Learning Resources

This project demonstrates:
- **REST API Design**: CRUD operations, filtering, pagination
- **Database Modeling**: Normalized schema with relationships
- **Authentication**: API key-based auth middleware
- **Validation**: Request validation with Zod
- **Testing**: Integration tests with isolated test DB
- **Docker**: Multi-stage builds, service orchestration
- **TypeScript**: Type-safe end-to-end

---

## 📝 Resume Talking Points

> "Built AgentGuide, a Node.js + PostgreSQL observability backend for agentic workflows. Implemented normalized run/step schema, REST APIs with validation and auth, comprehensive test suite, and Docker deployment—reducing agent debugging time with trace-level visibility into tool calls, errors, and latencies."

**Key Metrics to Mention:**
- RESTful API with 8+ endpoints
- Multi-stage Docker build for production deployment
- Integration test coverage with Jest/Supertest
- Prisma ORM for type-safe database access
- Supports metrics aggregation (avg latency, success rates, etc.)

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- [ ] GraphQL API for flexible querying
- [ ] Rate limiting middleware
- [ ] Redis-backed job queue for high-volume ingestion
- [ ] Frontend dashboard (React/Next.js)
- [ ] OpenTelemetry integration
- [ ] Load testing with k6

---

## 📄 License

MIT License - feel free to use this in your projects!

---

## 🔗 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Zod Validation](https://zod.dev/)

---

**Questions?** Open an issue or reach out!
