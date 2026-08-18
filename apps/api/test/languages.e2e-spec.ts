import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('LanguagesController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    await seedLanguages(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists active languages', async () => {
    const response = await request(app.getHttpServer())
      .get('/languages')
      .expect(200);

    const body = response.body as Array<{
      id: string;
      code: string;
      name: string;
      sortOrder: number;
    }>;

    expect(body.length).toBeGreaterThanOrEqual(3);
    expect(body[0]?.code).toBe('en');
    expect(body.some((language) => language.code === 'fi')).toBe(true);
  });
});

async function seedLanguages(prisma: PrismaService): Promise<void> {
  const languages = [
    { code: 'en', name: 'English', sortOrder: 1 },
    { code: 'fi', name: 'Finnish', sortOrder: 2 },
    { code: 'de', name: 'German', sortOrder: 3 },
  ];

  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      create: { ...language, status: LanguageStatus.ACTIVE },
      update: {
        name: language.name,
        sortOrder: language.sortOrder,
        status: LanguageStatus.ACTIVE,
      },
    });
  }
}
