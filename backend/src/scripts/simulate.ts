import { prisma } from "../prisma/client";

// Parse CLI arguments
const args = process.argv.slice(2);
const numRuns = parseInt(args[0]) || 50;
const errorRate = parseFloat(args[1]) || 0.15; // 15% error rate by default

// Realistic tool names and their typical latencies (in ms)
const TOOLS = [
  { name: "web_search", minMs: 800, maxMs: 3000 },
  { name: "web_scrape", minMs: 1200, maxMs: 5000 },
  { name: "text_summarize", minMs: 500, maxMs: 2000 },
  { name: "image_generate", minMs: 2000, maxMs: 8000 },
  { name: "database_query", minMs: 100, maxMs: 800 },
  { name: "api_call", minMs: 300, maxMs: 1500 },
  { name: "file_read", minMs: 50, maxMs: 300 },
  { name: "code_execute", minMs: 200, maxMs: 2000 },
];

// Realistic error messages
const ERRORS = [
  "Connection timeout after 30 seconds",
  "Rate limit exceeded: 429 Too Many Requests",
  "API key invalid or expired",
  "Resource not found: 404",
  "Server error: 500 Internal Server Error",
  "Network unreachable",
  "Invalid input format",
  "Permission denied",
  "Service unavailable: 503",
  "Request entity too large",
];

// Sample prompts for variety
const PROMPTS = [
  "Research the latest AI trends in 2025",
  "Summarize quarterly earnings reports",
  "Find competitors in the SaaS market",
  "Generate product description from image",
  "Analyze customer sentiment from reviews",
  "Extract structured data from documents",
  "Translate and localize content",
  "Monitor social media mentions",
  "Generate sales forecast report",
  "Automate data pipeline processing",
];

function randomLatency(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function shouldFail(rate: number): boolean {
  return Math.random() < rate;
}

async function simulate(runs: number, errorRate: number) {
  console.log(`🎯 Generating ${runs} runs with ${(errorRate * 100).toFixed(0)}% error rate...`);

  const agents = await prisma.agent.findMany();
  if (agents.length === 0) {
    throw new Error("No agents found. Run seed.ts first.");
  }

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < runs; i++) {
    const agent = randomItem(agents);
    const prompt = randomItem(PROMPTS);
    const startedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random within last 7 days

    // Create run
    const run = await prisma.run.create({
      data: {
        agentId: agent.id,
        input: { prompt, context: `Simulated run ${i + 1}` },
        status: "RUNNING",
        startedAt,
      },
    });

    // Generate 2-5 steps per run
    const numSteps = Math.floor(Math.random() * 4) + 2;
    let runHasError = false;
    let currentTime = startedAt.getTime();

    for (let s = 0; s < numSteps; s++) {
      const tool = randomItem(TOOLS);
      const stepStartedAt = new Date(currentTime);
      const latency = randomLatency(tool.minMs, tool.maxMs);
      const stepFinishedAt = new Date(currentTime + latency);

      // Decide if this step fails
      const stepFails = !runHasError && shouldFail(errorRate);

      const stepData: any = {
        runId: run.id,
        index: s,
        toolName: tool.name,
        input: {
          query: prompt.substring(0, 50),
          options: { timeout: 30000, retries: 3 },
        },
        startedAt: stepStartedAt,
      };

      if (stepFails) {
        // Step fails with error
        stepData.error = randomItem(ERRORS);
        stepData.finishedAt = stepFinishedAt;
        runHasError = true;
      } else {
        // Step succeeds with output
        stepData.output = {
          result: `Processed by ${tool.name}`,
          itemsFound: Math.floor(Math.random() * 100),
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
        };
        stepData.finishedAt = stepFinishedAt;
      }

      await prisma.step.create({ data: stepData });

      currentTime += latency;

      // If step failed, stop adding more steps
      if (stepFails) break;
    }

    // Update run status
    const runStatus = runHasError ? "FAILED" : "SUCCESS";
    const runFinishedAt = new Date(currentTime);

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: runStatus,
        output: runHasError
          ? { error: "Run failed due to step error" }
          : { summary: "All steps completed successfully", stepsCompleted: numSteps },
        finishedAt: runFinishedAt,
      },
    });

    if (runHasError) {
      failureCount++;
    } else {
      successCount++;
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`   Generated ${i + 1}/${runs} runs...`);
    }
  }

  console.log(`\n✅ Simulation complete!`);
  console.log(`   Success: ${successCount} runs (${((successCount / runs) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${failureCount} runs (${((failureCount / runs) * 100).toFixed(1)}%)`);
  console.log(`\n💡 Try these queries:`);
  console.log(`   curl http://localhost:4000/v1/metrics/summary`);
  console.log(`   curl http://localhost:4000/v1/runs?status=FAILED`);
}

// Run simulation
simulate(numRuns, errorRate)
  .catch((err) => {
    console.error("❌ Simulation failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
