import { BadRequestException } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { LanguagesRepository } from '../persistence/languages.repository';
import { Language } from '../domain/language';

describe('LanguagesService', () => {
  let languagesRepository: jest.Mocked<
    Pick<LanguagesRepository, 'findActive' | 'findActiveByIds'>
  >;
  let service: LanguagesService;

  const activeLanguages: Language[] = [
    { id: 'lang-en', code: 'en', name: 'English', sortOrder: 1 },
    { id: 'lang-fi', code: 'fi', name: 'Finnish', sortOrder: 2 },
  ];

  beforeEach(() => {
    languagesRepository = {
      findActive: jest.fn(),
      findActiveByIds: jest.fn(),
    };
    service = new LanguagesService(
      languagesRepository as unknown as LanguagesRepository,
    );
  });

  it('lists active languages', async () => {
    languagesRepository.findActive.mockResolvedValue(activeLanguages);

    await expect(service.listActive()).resolves.toEqual(activeLanguages);
  });

  it('asserts all requested language ids are active', async () => {
    languagesRepository.findActiveByIds.mockResolvedValue(activeLanguages);

    await expect(
      service.assertActiveIds(['lang-en', 'lang-fi']),
    ).resolves.toEqual(activeLanguages);
    expect(languagesRepository.findActiveByIds).toHaveBeenCalledWith([
      'lang-en',
      'lang-fi',
    ]);
  });

  it('deduplicates language ids before validation', async () => {
    languagesRepository.findActiveByIds.mockResolvedValue([activeLanguages[0]]);

    await expect(
      service.assertActiveIds(['lang-en', 'lang-en']),
    ).resolves.toEqual([activeLanguages[0]]);
    expect(languagesRepository.findActiveByIds).toHaveBeenCalledWith([
      'lang-en',
    ]);
  });

  it('rejects invalid language ids', async () => {
    languagesRepository.findActiveByIds.mockResolvedValue([activeLanguages[0]]);

    await expect(
      service.assertActiveIds(['lang-en', 'missing-id']),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
