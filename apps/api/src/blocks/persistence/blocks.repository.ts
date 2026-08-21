import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BlocksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(blockerUserId: string, blockedUserId: string): Promise<void> {
    await this.prisma.userBlock.create({
      data: { blockerUserId, blockedUserId },
    });
  }

  async delete(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    const result = await this.prisma.userBlock.deleteMany({
      where: { blockerUserId, blockedUserId },
    });
    return result.count > 0;
  }

  async findBlockedUserIdsForViewer(viewerUserId: string): Promise<string[]> {
    const rows = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerUserId: viewerUserId }, { blockedUserId: viewerUserId }],
      },
      select: {
        blockerUserId: true,
        blockedUserId: true,
      },
    });

    const ids = new Set<string>();
    for (const row of rows) {
      if (row.blockerUserId !== viewerUserId) {
        ids.add(row.blockerUserId);
      }
      if (row.blockedUserId !== viewerUserId) {
        ids.add(row.blockedUserId);
      }
    }
    return [...ids];
  }

  async exists(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    const row = await this.prisma.userBlock.findUnique({
      where: {
        blockerUserId_blockedUserId: { blockerUserId, blockedUserId },
      },
    });
    return row !== null;
  }
}
