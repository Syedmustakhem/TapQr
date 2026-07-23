import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";

export interface RegisterUserRepositoryInput {
  fullName: string;
  email: string;
  passwordHash: string;
}

export class AuthRepository {

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
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

  async registerUser(
    data: RegisterUserRepositoryInput
  ) {
    return prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {

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
      }
    );
  }
}