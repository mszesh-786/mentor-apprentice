import { Role, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import { ConflictError, NotFoundError } from '../../common/errors/domain-error';
import { UsersService } from '../../users/users.service';
import { ApprenticeProfile } from '../domain/apprentice-profile';
import { ApprenticesRepository } from '../persistence/apprentices.repository';
import { ApprenticesService } from './apprentices.service';

describe('ApprenticesService', () => {
  const activeUser: AuthUser = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'apprentice@example.com',
    emailVerified: true,
    displayName: 'Priya',
    status: UserStatus.ACTIVE,
    roles: [Role.APPRENTICE],
  };

  const profile: ApprenticeProfile = {
    id: 'apprentice-1',
    userId: 'user-1',
    shortBio: 'Learning car maintenance',
    generalLocation: 'London',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let apprenticesRepository: jest.Mocked<
    Pick<ApprenticesRepository, 'findByUserId' | 'create' | 'update'>
  >;
  let usersService: jest.Mocked<Pick<UsersService, 'ensureRole'>>;
  let service: ApprenticesService;

  beforeEach(() => {
    apprenticesRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    usersService = {
      ensureRole: jest.fn().mockResolvedValue({
        ...activeUser,
        roles: [Role.MENTOR, Role.APPRENTICE],
      }),
    };
    service = new ApprenticesService(
      apprenticesRepository as unknown as ApprenticesRepository,
      usersService as unknown as UsersService,
    );
  });

  it('creates apprentice profile and ensures APPRENTICE role', async () => {
    apprenticesRepository.findByUserId.mockResolvedValue(null);
    apprenticesRepository.create.mockResolvedValue(profile);

    const mentorUser = { ...activeUser, roles: [Role.MENTOR] };
    await expect(
      service.createProfile(mentorUser, {
        shortBio: 'Learning car maintenance',
        generalLocation: 'London',
      }),
    ).resolves.toEqual(profile);

    expect(usersService.ensureRole).toHaveBeenCalledWith(
      'user-1',
      Role.APPRENTICE,
    );
  });

  it('rejects duplicate apprentice profile', async () => {
    apprenticesRepository.findByUserId.mockResolvedValue(profile);

    await expect(service.createProfile(activeUser, {})).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('returns own profile', async () => {
    apprenticesRepository.findByUserId.mockResolvedValue(profile);
    await expect(service.getMyProfile(activeUser)).resolves.toEqual(profile);
  });

  it('throws when apprentice profile is missing', async () => {
    apprenticesRepository.findByUserId.mockResolvedValue(null);
    await expect(service.getMyProfile(activeUser)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
