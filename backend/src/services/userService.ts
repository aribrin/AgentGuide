import prisma from "../prisma/client";

export const UserService = {
  async getByApiKey(apiKey: string) {
    return prisma.user.findUnique({
      where: { apiKeys: apiKey },
    });
  },

  async createUser(data: { email: string; name?: string }) {
    // Normally you'd hash API keys, but for dev we’ll auto-generate.
    const apiKey = `key_${Math.random().toString(36).substring(2, 10)}`;
    return prisma.user.create({
      data: { ...data, apiKeys: apiKey },
    });
  },
};
