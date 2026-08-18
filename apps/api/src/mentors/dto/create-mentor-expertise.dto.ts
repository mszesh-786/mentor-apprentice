import { TeachingLevel } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMentorExpertiseDto {
  @IsString()
  skillId!: string;

  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(TeachingLevel)
  teachingLevel!: TeachingLevel;
}
