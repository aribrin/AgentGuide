import prisma from "../prisma/client";

export const agentService = {
  async getAllAgents() {
    return prisma.agent.findMany();
  },

  async createAgent(data: { name: string; version: string; description?: string }) {
    return prisma.agent.create({ data });
  },

  async getAgentById(id: number) {
    return prisma.agent.findUnique({ where: { id } });
  },

  async updateAgent(id: number, data: Partial<{ name: string; version: string; description: string }>) {
    return prisma.agent.update({ where: { id }, data });
  },

  async deleteAgent(id: number) {
    return prisma.agent.delete({ where: { id } });
  },
};
