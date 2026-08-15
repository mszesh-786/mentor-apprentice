import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { EnsureUserInput, UserRecord } from './users.types';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAuthProviderId(
    authProviderId: string,
  ): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { authProviderId },
      include: { roles: true },
    });
    if (!user) {
      return null;
    }
    return this.toRecord(user);
  }

  async create(input: EnsureUserInput): Promise<UserRecord> {
    const roles = input.roles ?? [];
    const user = await this.prisma.user.create({
      data: {
        authProviderId: input.authProviderId,
        email: input.email,
        displayName: input.displayName,
        emailVerified: input.emailVerified ?? false,
        roles: {
          create: roles.map((role) => ({ role })),
        },
      },
      include: { roles: true },
    });
    return this.toRecord(user);
  }

  async syncRoles(userId: string, roles: Role[]): Promise<UserRecord> {
    await this.prisma.$transaction(
      roles.map((role) =>
        this.prisma.userRole.upsert({
          where: {
            userId_role: { userId, role },
          },
          create: { userId, role },
          update: {},
        }),
      ),
    );

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { roles: true },
    });
    return this.toRecord(user);
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { displayName },
    });
  }

  private toRecord(user: {
    id: string;
    authProviderId: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
    status: UserRecord['status'];
    roles: { role: Role }[];
  }): UserRecord {
    return {
      id: user.id,
      authProviderId: user.authProviderId,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      status: user.status,
      roles: user.roles.map((entry) => entry.role),
    };
  }
}
