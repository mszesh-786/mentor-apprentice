import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth-user';
import { UsersRepository } from './users.repository';
import { EnsureUserInput, UserRecord } from './users.types';

const assignableRoles = new Set<Role>([Role.MENTOR, Role.APPRENTICE]);

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async ensureFromAuthProvider(input: EnsureUserInput): Promise<AuthUser> {
    const acceptClientRoles = input.acceptClientRoles !== false;
    const existing = await this.usersRepository.findByAuthProviderId(
      input.authProviderId,
    );

    if (!existing) {
      return this.usersRepository.create({
        ...input,
        roles: acceptClientRoles ? input.roles : [],
        acceptClientRoles,
      });
    }

    let current = existing;
    const needsProfileSync =
      (input.emailVerified !== undefined &&
        input.emailVerified !== existing.emailVerified) ||
      (input.email !== undefined && input.email !== existing.email) ||
      (input.displayName !== undefined &&
        input.displayName !== existing.displayName);

    if (needsProfileSync) {
      current = await this.usersRepository.updateProfileFields(existing.id, {
        email: input.email,
        displayName: input.displayName ?? existing.displayName,
        emailVerified: input.emailVerified,
      });
    }

    if (!acceptClientRoles) {
      return current;
    }

    const incomingRoles = input.roles ?? [];
    const missingRoles = incomingRoles.filter(
      (role) => !current.roles.includes(role),
    );

    if (missingRoles.length === 0) {
      return current;
    }

    return this.usersRepository.syncRoles(current.id, incomingRoles);
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.usersRepository.updateDisplayName(userId, displayName);
  }

  async findById(userId: string): Promise<UserRecord | null> {
    return this.usersRepository.findById(userId);
  }

  async ensureRole(userId: string, role: Role): Promise<UserRecord> {
    return this.usersRepository.ensureRole(userId, role);
  }

  async getMe(user: AuthUser): Promise<UserRecord> {
    const record = await this.usersRepository.findById(user.id);
    if (!record) {
      return user;
    }
    return record;
  }

  async setRoles(user: AuthUser, roles: Role[]): Promise<UserRecord> {
    const unique = [...new Set(roles)];
    if (unique.length === 0) {
      throw new BadRequestException('At least one role is required');
    }
    for (const role of unique) {
      if (!assignableRoles.has(role)) {
        throw new BadRequestException(`Role ${role} cannot be self-assigned`);
      }
    }

    // Additive: keep existing roles, add requested ones (supports dual later)
    for (const role of unique) {
      await this.usersRepository.ensureRole(user.id, role);
    }
    const updated = await this.usersRepository.findById(user.id);
    if (!updated) {
      throw new BadRequestException('User not found');
    }
    return updated;
  }
}
