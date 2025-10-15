import prisma from "../prisma/client";

export const RunService = {
    // create a new run
    async createRun(data: {
        agentId: number;
        userId?: number;
        input: object
    }) {
        return prisma.run.create({ 
            data: {
                agentId: data.agentId,
                userId: data.userId,
                input: data.input,
            },
        });
    },


    // fetch a run and include steps + metrics
    async getRun(runId: number) {
        return prisma.run.findUnique({
            where: { id: runId },
            include: {
                agent: true,
                steps: {
                    include: { artifacts: true}
                },
                metrics: true,
            },
        });
    },

    // update a run (statues, output, finishedAt)
    async updateRun(runId: number, data: Partial<{
        status: import('@prisma/client').RunStatus;
        output: object;
        finishedAt: Date;
    }>) {
        return prisma.run.update({
            where: { id: runId },
            data,
        });
    },
}

    