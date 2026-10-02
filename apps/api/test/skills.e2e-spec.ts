import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogueStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('SkillsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let automotiveId: string;

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
    automotiveId = await seedSkills(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists skill categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/skills/categories')
      .expect(200);

    const body = response.body as Array<{
      id: string;
      slug: string;
      name: string;
    }>;

    expect(body.some((category) => category.slug === 'automotive')).toBe(true);
    expect(body.some((category) => category.slug === 'disabled-category')).toBe(
      false,
    );
  });

  it('lists active skills', async () => {
    const response = await request(app.getHttpServer())
      .get('/skills')
      .expect(200);

    const body = response.body as Array<{
      slug: string;
      category: { slug: string };
    }>;

    expect(body.some((skill) => skill.slug === 'basic-car-maintenance')).toBe(
      true,
    );
    expect(body.some((skill) => skill.slug === 'disabled-skill')).toBe(false);
  });

  it('filters skills by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/skills')
      .query({ categoryId: automotiveId })
      .expect(200);

    const body = response.body as Array<{ category: { id: string } }>;
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((skill) => skill.category.id === automotiveId)).toBe(
      true,
    );
  });
});

async function seedSkills(prisma: PrismaService): Promise<string> {
  const automotive = await prisma.skillCategory.upsert({
    where: { slug: 'automotive' },
    create: {
      slug: 'automotive',
      name: 'Automotive',
      sortOrder: 1,
      status: CatalogueStatus.ACTIVE,
    },
    update: {
      name: 'Automotive',
      sortOrder: 1,
      status: CatalogueStatus.ACTIVE,
    },
  });

  await prisma.skillCategory.upsert({
    where: { slug: 'disabled-category' },
    create: {
      slug: 'disabled-category',
      name: 'Disabled Category',
      sortOrder: 99,
      status: CatalogueStatus.DISABLED,
    },
    update: {
      name: 'Disabled Category',
      sortOrder: 99,
      status: CatalogueStatus.DISABLED,
    },
  });

  await prisma.skill.upsert({
    where: { slug: 'basic-car-maintenance' },
    create: {
      slug: 'basic-car-maintenance',
      name: 'Basic Car Maintenance',
      sortOrder: 1,
      status: CatalogueStatus.ACTIVE,
      categoryId: automotive.id,
    },
    update: {
      name: 'Basic Car Maintenance',
      sortOrder: 1,
      status: CatalogueStatus.ACTIVE,
      categoryId: automotive.id,
    },
  });

  await prisma.skill.upsert({
    where: { slug: 'disabled-skill' },
    create: {
      slug: 'disabled-skill',
      name: 'Disabled Skill',
      sortOrder: 99,
      status: CatalogueStatus.DISABLED,
      categoryId: automotive.id,
    },
    update: {
      name: 'Disabled Skill',
      sortOrder: 99,
      status: CatalogueStatus.DISABLED,
      categoryId: automotive.id,
    },
  });

  return automotive.id;
}
