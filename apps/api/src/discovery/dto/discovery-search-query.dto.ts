import { TeachingLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class DiscoverySearchQueryDto {
  @IsString()
  skillId!: string;

  @IsOptional()
  @IsString()
  languageId?: string;

  @IsOptional()
  @IsEnum(TeachingLevel)
  teachingLevel?: TeachingLevel;
}
