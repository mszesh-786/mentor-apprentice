import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SetRolesDto, UserMeResponseDto } from './dto/users.dto';
import { UsersService } from './users.service';
import { UserRecord } from './users.types';

function toMeResponse(user: UserRecord | AuthUser): UserMeResponseDto {
  const roles = user.roles.filter(
    (role) => role === 'MENTOR' || role === 'APPRENTICE',
  );
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    status: user.status,
    roles: user.roles,
    needsRoleSelection: roles.length === 0,
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser): Promise<UserMeResponseDto> {
    const me = await this.usersService.getMe(user);
    return toMeResponse(me);
  }

  @Post('me/roles')
  @HttpCode(HttpStatus.OK)
  async setRoles(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetRolesDto,
  ): Promise<UserMeResponseDto> {
    const updated = await this.usersService.setRoles(user, dto.roles);
    return toMeResponse(updated);
  }
}
