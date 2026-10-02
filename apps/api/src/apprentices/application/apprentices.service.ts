import { Injectable } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { AuthUser } from '../../auth/auth-user';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/domain-error';
import { UsersService } from '../../users/users.service';
import { CreateApprenticeProfileDto } from '../dto/create-apprentice-profile.dto';
import { UpdateApprenticeProfileDto } from '../dto/update-apprentice-profile.dto';
import { ApprenticeProfile } from '../domain/apprentice-profile';
import { ApprenticesRepository } from '../persistence/apprentices.repository';

@Injectable()
export class ApprenticesService {
  constructor(
    private readonly apprenticesRepository: ApprenticesRepository,
    private readonly usersService: UsersService,
  ) {}

  async createProfile(
    user: AuthUser,
    dto: CreateApprenticeProfileDto,
  ): Promise<ApprenticeProfile> {
    this.assertActive(user);

    const existing = await this.apprenticesRepository.findByUserId(user.id);
    if (existing) {
      throw new ConflictError('Apprentice profile already exists');
    }

    await this.usersService.ensureRole(user.id, Role.APPRENTICE);

    return this.apprenticesRepository.create({
      userId: user.id,
      shortBio: dto.shortBio,
      generalLocation: dto.generalLocation,
    });
  }

  async getMyProfile(user: AuthUser): Promise<ApprenticeProfile> {
    const profile = await this.apprenticesRepository.findByUserId(user.id);
    if (!profile) {
      throw new NotFoundError('Apprentice profile not found');
    }
    return profile;
  }

  async updateMyProfile(
    user: AuthUser,
    dto: UpdateApprenticeProfileDto,
  ): Promise<ApprenticeProfile> {
    this.assertActive(user);

    const existing = await this.apprenticesRepository.findByUserId(user.id);
    if (!existing) {
      throw new NotFoundError('Apprentice profile not found');
    }

    return this.apprenticesRepository.update(user.id, {
      shortBio: dto.shortBio,
      generalLocation: dto.generalLocation,
    });
  }

  private assertActive(user: AuthUser): void {
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenError('Account is not active');
    }
  }
}
