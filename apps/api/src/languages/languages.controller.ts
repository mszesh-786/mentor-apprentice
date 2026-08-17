import {Controller, Get} from '@nestjs/common';
import { LanguageService } from './application/languages.service';
import {LanguageResponseDto} from './dto/language-response.dto';
import { toLanguageResponse } from './mappers/language.mapper';


@Controller('languages')

export class LanguagesController {
    constructor(private readonly languageService: LanguageService) {}
    @Get()
    async list(): Promise<LanguageResponseDto[]> {
        const languages = await this.languageService.listActive();
        return languages.map(toLanguageResponse);
    }
}