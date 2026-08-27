import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface RegisterUserRepositoryInput {
  fullName: string;
  email: string;
  passwordHash: string;
}

export interface CreateVerifiedUserInput {
  fullName: string;
  email?: string;
  phone?: string;
  provider: "EMAIL" | "PHONE" | "GOOGLE";
  providerUserId?: string;
}

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findUserWithAuth(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        authProviders: true,
      },
    });
  }

  async findAuthProviderByUserId(userId: string) {
    return prisma.authProvider.findFirst({
      where: {
        userId,
        provider: "EMAIL",
      },
    });
  }

  async findAuthProviderByProviderUserId(
    provider: "EMAIL" | "PHONE" | "GOOGLE",
    providerUserId: string
  ) {
    return prisma.authProvider.findFirst({
      where: { provider, providerUserId },
      include: { user: true },
    });
  }

  async registerUser(data: RegisterUserRepositoryInput) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
        },
      });

      await tx.authProvider.create({
        data: {
          provider: "EMAIL",
          passwordHash: data.passwordHash,
          isVerified: false,
          userId: user.id,
        },
      });

      return user;
    });
  }

  async createVerifiedUser(data: CreateVerifiedUserInput) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
        },
      });

      await tx.authProvider.create({
        data: {
          provider: data.provider,
          providerUserId: data.providerUserId,
          isVerified: true,
          userId: user.id,
        },
      });

      return user;
    });
  }

  async linkVerifiedProvider(
    userId: string,
    provider: "EMAIL" | "PHONE" | "GOOGLE",
    providerUserId?: string
  ) {
    return prisma.authProvider.upsert({
      where: { provider_userId: { provider, userId } },
      create: { provider, providerUserId, userId, isVerified: true },
      update: { isVerified: true, providerUserId },
    });
  }

  async createOtp(data: {
    identifier: string;
    channel: "EMAIL" | "WHATSAPP";
    otpHash: string;
    expiresAt: Date;
    maxAttempts: number;
  }) {
    return prisma.otpVerification.create({ data });
  }

  async findLatestOtp(identifier: string, channel: "EMAIL" | "WHATSAPP") {
    return prisma.otpVerification.findFirst({
      where: { identifier, channel, consumed: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async incrementOtpAttempts(id: string) {
    return prisma.otpVerification.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async consumeOtp(id: string) {
    return prisma.otpVerification.update({
      where: { id },
      data: { consumed: true },
    });
  }
}