import prisma from "../prisma/client";

export const MetricsService = {
  async getSummary(agentId?: number, from?: string, to?: string) {
    const where: any = {};
    if (agentId) where.agentId = agentId;
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);

    // Fetch runs and steps to compute summary stats
    const runs = await prisma.run.findMany({
      where,
      include: {
        steps: true,
      },
    });

    if (runs.length === 0) {
      return {
        totalRuns: 0,
        avgDurationMs: 0,
        totalSteps: 0,
        successRate: 0,
        avgStepsPerRun: 0,
      };
    }

    let totalDuration = 0;
    let finishedCount = 0;
    let successCount = 0;
    let totalSteps = 0;

    for (const run of runs) {
      if (run.finishedAt && run.startedAt) {
        const duration =
          run.finishedAt.getTime() - run.startedAt.getTime();
        totalDuration += duration;
        finishedCount++;
      }

      const hasErrors = run.steps.some((s) => s.error !== null);
      if (!hasErrors && run.steps.length > 0) successCount++;
      totalSteps += run.steps.length;
    }

    const avgDurationMs = finishedCount > 0 ? totalDuration / finishedCount : 0;
    const successRate = (successCount / runs.length) * 100;
    const avgStepsPerRun = totalSteps / runs.length;

    return {
      totalRuns: runs.length,
      avgDurationMs,
      totalSteps,
      successRate,
      avgStepsPerRun,
    };
  },
};
