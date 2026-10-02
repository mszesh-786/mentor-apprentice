import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateApprenticeProfileDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  shortBio?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(120)
  generalLocation?: string | null;
}
