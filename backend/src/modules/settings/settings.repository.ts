import { prisma } from "../../config/prisma";

/*
 * ============================================================
 * SETTINGS REPOSITORY
 * ============================================================
 */

export class SettingsRepository {
  async getPreferences(
    userId: string
  ) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        language: true,
        timezone: true,
      },
    });
  }

  async updatePreferences(
    userId: string,
    data: {
      language?: string;
      timezone?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        language: true,
        timezone: true,
      },
    });
  }

  async listApiKeys(
    userId: string
  ) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  async createApiKey(data: {
    userId: string;
    name: string;
    keyHash: string;
    prefix: string;
    expiresAt: Date | null;
  }) {
    return prisma.apiKey.create({
      data,
      select: {
        id: true,
        name: true,
        prefix: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revokeApiKey(
    userId: string,
    keyId: string
  ) {
    const result =
      await prisma.apiKey.updateMany({
        where: {
          id: keyId,
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

    return result.count > 0;
  }

  async countActiveApiKeys(
    userId: string
  ) {
    return prisma.apiKey.count({
      where: {
        userId,
        revokedAt: null,
      },
    });
  }
}
