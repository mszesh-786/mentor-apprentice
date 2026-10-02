import { IsArray, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class SetRolesDto {
  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}

export class UserMeResponseDto {
  id!: string;
  email!: string;
  emailVerified!: boolean;
  displayName!: string | null;
  status!: string;
  roles!: Role[];
  needsRoleSelection!: boolean;
}
