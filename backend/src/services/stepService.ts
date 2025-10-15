import prisma from "../prisma/client";

export const StepService = {

    // add a new step to a run
    async createStep(data: {
        runId: number;
        index: number;
        toolName: string;
        input: object;
        startedAt: Date;
    }) {
        return prisma.step.create({
            data,
        });
    },

    // update step with (output, error, finishedAt)
    async updateStep(stepId: number, data: Partial<{
        output: object;
        error: string;
        finishedAt: Date;
    }>) {
        return prisma.step.update({
            where: { id: stepId },
            data,
        });
    },
};