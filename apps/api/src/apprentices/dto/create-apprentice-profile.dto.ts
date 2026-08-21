import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApprenticeProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortBio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  generalLocation?: string;
}
