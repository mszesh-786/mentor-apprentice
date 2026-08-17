import {BadRequestException, Injectable} from '@nestjs/common';
import {LanguagesRepository} from '../persistence/languages.repository';
import { Language } from '../domain/language';
import { LanguageResponseDto } from '../dto/language-response.dto';
import { toLanguageResponse } from '../mappers/language.mapper';



@Injectable()
export class LanguageService {
    constructor(private readonly lanaugesRepository: LanguagesRepository) {}


async listActive(): Promise<LanguageResponseDto[]> {
    const languages = await this.lanaugesRepository.findActive();
    return languages.map(toLanguageResponse);
}

async assertActiveIds(languageIds: string[]): Promise<Language[]> {
    const languages = await this.lanaugesRepository.findActiveByIds(languageIds);
    if (languages.length !== languageIds.length) {
        throw new BadRequestException('Some languages are not active');
    }
    return languages;
}
}