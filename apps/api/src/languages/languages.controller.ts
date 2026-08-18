import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from './application/languages.service';
import { LanguageResponseDto } from './dto/language-response.dto';
import { toLanguageResponse } from './mappers/language.mapper';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  async list(): Promise<LanguageResponseDto[]> {
    const languages = await this.languagesService.listActive();
    return languages.map(toLanguageResponse);
  }
}
