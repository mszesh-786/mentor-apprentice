import { Injectable, BadRequestException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { UsersService } from '../../users/users.service';
import { BlocksRepository } from '../persistence/blocks.repository';

@Injectable()
export class BlocksService {
  constructor(
    private readonly blocksRepository: BlocksRepository,
    private readonly usersService: UsersService,
  ) {}

  async blockUser(user: AuthUser, blockedUserId: string): Promise<void> {
    this.assertActive(user);

    if (user.id === blockedUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const target = await this.usersService.findById(blockedUserId);
    if (!target) {
      throw new NotFoundError('User not found');
    }

    const exists = await this.blocksRepository.exists(user.id, blockedUserId);
    if (exists) {
      throw new ConflictError('User is already blocked');
    }

    await this.blocksRepository.create(user.id, blockedUserId);
  }

  async unblockUser(user: AuthUser, blockedUserId: string): Promise<void> {
    this.assertActive(user);
    const deleted = await this.blocksRepository.delete(user.id, blockedUserId);
    if (!deleted) {
      throw new NotFoundError('Block not found');
    }
  }

  async getExcludedUserIds(viewerUserId: string): Promise<string[]> {
    return this.blocksRepository.findBlockedUserIdsForViewer(viewerUserId);
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
