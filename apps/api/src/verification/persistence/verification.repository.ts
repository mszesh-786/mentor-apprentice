import { Injectable } from '@nestjs/common';
import {
  VerificationProvider,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { IdentityVerification } from '../domain/verification';

@Injectable()
export class VerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findIdentityByUserId(
    userId: string,
  ): Promise<IdentityVerification | null> {
    const row = await this.prisma.verification.findUnique({
      where: {
        userId_type: { userId, type: VerificationType.IDENTITY },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async createIdentity(userId: string): Promise<IdentityVerification> {
    const row = await this.prisma.verification.create({
      data: {
        userId,
        type: VerificationType.IDENTITY,
        status: VerificationStatus.PENDING,
        provider: VerificationProvider.STUB,
        submittedAt: new Date(),
      },
    });
    return this.toDomain(row);
  }

  async updateIdentity(
    userId: string,
    data: {
      status: VerificationStatus;
      submittedAt?: Date | null;
      verifiedAt?: Date | null;
    },
  ): Promise<IdentityVerification> {
    const row = await this.prisma.verification.update({
      where: {
        userId_type: { userId, type: VerificationType.IDENTITY },
      },
      data,
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    userId: string;
    type: VerificationType;
    status: VerificationStatus;
    provider: VerificationProvider;
    submittedAt: Date | null;
    verifiedAt: Date | null;
  }): IdentityVerification {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      status: row.status,
      provider: row.provider,
      submittedAt: row.submittedAt,
      verifiedAt: row.verifiedAt,
    };
  }
}
