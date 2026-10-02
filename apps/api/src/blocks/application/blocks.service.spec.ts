import { BadRequestException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { BookingsService } from '../../bookings/application/bookings.service';
import { MentorshipsService } from '../../mentorships/application/mentorships.service';
import { UsersService } from '../../users/users.service';
import { UserRecord } from '../../users/users.types';
import { BlocksRepository } from '../persistence/blocks.repository';
import { BlocksService } from './blocks.service';

describe('BlocksService', () => {
  const actor: AuthUser = {
    id: 'user-a',
    authProviderId: 'sub-a',
    email: 'a@example.com',
    displayName: 'A',
    roles: [Role.APPRENTICE],
    emailVerified: true,
    status: UserStatus.ACTIVE,
  };

  let repository: jest.Mocked<BlocksRepository>;
  let usersService: jest.Mocked<Pick<UsersService, 'findById'>>;
  let mentorshipsService: jest.Mocked<
    Pick<MentorshipsService, 'endActiveBetweenUsers'>
  >;
  let bookingsService: jest.Mocked<
    Pick<BookingsService, 'cancelOpenBetweenUsers'>
  >;
  let service: BlocksService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findBlockedUserIdsForViewer: jest.fn(),
      listForBlocker: jest.fn(),
    } as unknown as jest.Mocked<BlocksRepository>;
    usersService = { findById: jest.fn() };
    mentorshipsService = { endActiveBetweenUsers: jest.fn() };
    bookingsService = { cancelOpenBetweenUsers: jest.fn() };
    service = new BlocksService(
      repository,
      usersService as UsersService,
      mentorshipsService as MentorshipsService,
      bookingsService as BookingsService,
    );
  });

  it('blocks user and cancels open bookings', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-b',
      authProviderId: 'sub-b',
      email: 'b@example.com',
      displayName: 'B',
      roles: [Role.MENTOR],
      emailVerified: true,
      status: UserStatus.ACTIVE,
    } satisfies UserRecord);
    repository.exists.mockResolvedValue(false);

    await service.blockUser(actor, 'user-b');

    expect(repository.create).toHaveBeenCalledWith('user-a', 'user-b');
    expect(mentorshipsService.endActiveBetweenUsers).toHaveBeenCalledWith(
      'user-a',
      'user-b',
      'user-a',
    );
    expect(bookingsService.cancelOpenBetweenUsers).toHaveBeenCalledWith(
      'user-a',
      'user-a',
      'user-b',
    );
  });

  it('rejects self-block', async () => {
    await expect(service.blockUser(actor, actor.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
