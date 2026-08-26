import { Role, UserStatus } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const baseUser: AuthUser = {
    id: 'user-1',
    authProviderId: 'auth-1',
    email: 'a@example.com',
    displayName: 'Alex',
    roles: [],
    emailVerified: true,
    status: UserStatus.ACTIVE,
  };

  let repository: jest.Mocked<UsersRepository>;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findByAuthProviderId: jest.fn(),
      create: jest.fn(),
      updateProfileFields: jest.fn(),
      syncRoles: jest.fn(),
      updateDisplayName: jest.fn(),
      findById: jest.fn(),
      ensureRole: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;
    service = new UsersService(repository);
  });

  it('does not sync client roles when acceptClientRoles is false', async () => {
    repository.findByAuthProviderId.mockResolvedValue({
      ...baseUser,
      roles: [Role.MENTOR],
    });

    const result = await service.ensureFromAuthProvider({
      authProviderId: 'auth-1',
      email: 'a@example.com',
      emailVerified: true,
      roles: [Role.APPRENTICE],
      acceptClientRoles: false,
    });

    expect(result.roles).toEqual([Role.MENTOR]);
    expect(repository.syncRoles).not.toHaveBeenCalled();
  });

  it('assigns mentor and apprentice roles', async () => {
    repository.ensureRole.mockResolvedValue({
      ...baseUser,
      roles: [Role.MENTOR],
    });
    repository.findById.mockResolvedValue({
      ...baseUser,
      roles: [Role.MENTOR, Role.APPRENTICE],
    });

    const updated = await service.setRoles(baseUser, [
      Role.MENTOR,
      Role.APPRENTICE,
    ]);

    expect(repository.ensureRole).toHaveBeenCalledTimes(2);
    expect(updated.roles).toEqual([Role.MENTOR, Role.APPRENTICE]);
  });
});
