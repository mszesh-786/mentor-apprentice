import { IsArray, IsString } from 'class-validator';

export class SetMentorLanguagesDto {
  @IsArray()
  @IsString({ each: true })
  languageIds!: string[];
}
