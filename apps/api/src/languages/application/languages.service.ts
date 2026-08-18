import { BadRequestException, Injectable } from '@nestjs/common';
import { LanguagesRepository } from '../persistence/languages.repository';
import { Language } from '../domain/language';

@Injectable()
export class LanguagesService {
  constructor(private readonly languagesRepository: LanguagesRepository) {}

  async listActive(): Promise<Language[]> {
    return this.languagesRepository.findActive();
  }

  async assertActiveIds(languageIds: string[]): Promise<Language[]> {
    const uniqueIds = [...new Set(languageIds)];
    const languages = await this.languagesRepository.findActiveByIds(uniqueIds);

    if (languages.length !== uniqueIds.length) {
      throw new BadRequestException('One or more language ids are invalid');
    }

    return languages;
  }
}
