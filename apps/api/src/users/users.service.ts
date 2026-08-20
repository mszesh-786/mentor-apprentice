import { Injectable } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';
import { UsersRepository } from './users.repository';
import { EnsureUserInput, UserRecord } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async ensureFromAuthProvider(input: EnsureUserInput): Promise<AuthUser> {
    const existing = await this.usersRepository.findByAuthProviderId(
      input.authProviderId,
    );

    if (!existing) {
      const created = await this.usersRepository.create(input);
      return created;
    }

    const incomingRoles = input.roles ?? [];
    const missingRoles = incomingRoles.filter(
      (role) => !existing.roles.includes(role),
    );

    if (missingRoles.length === 0) {
      return existing;
    }

    return this.usersRepository.syncRoles(existing.id, incomingRoles);
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.usersRepository.updateDisplayName(userId, displayName);
  }

  async findById(userId: string): Promise<UserRecord | null> {
    return this.usersRepository.findById(userId);
  }
}
