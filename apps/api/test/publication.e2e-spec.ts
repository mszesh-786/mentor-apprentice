import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
  PublicationStatus,
  Role,
  TeachingLevel,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('PublicationController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorTokenPayload = {
    sub: 'e2e-publication-mentor',
    email: 'e2e-publication-mentor@example.com',
    displayName: 'Publication Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

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
    jwtService = app.get(JwtService);

    const languages = await seedLanguages(prisma);
    englishId = languages.englishId;
    const skills = await seedSkills(prisma);
    skillId = skills.skillId;
  });

  beforeEach(async () => {
    await prisma.analyticsEvent.deleteMany();
    await prisma.userBlock.deleteMany();
    await prisma.availabilityRule.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.mentorExpertise.deleteMany();
    await prisma.mentorLanguage.deleteMany();
    await prisma.mentorProfile.deleteMany();
    await prisma.apprenticeProfile.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.analyticsEvent.deleteMany();
    await prisma.userBlock.deleteMany();
    await prisma.availabilityRule.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.apprenticeProfile.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  function authHeader(payload: Record<string, unknown> = mentorTokenPayload) {
    const token = jwtService.sign(payload);
    return { Authorization: `Bearer ${token}` };
  }

  it('returns publication eligibility with missing requirements before publish', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Incomplete mentor' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/mentors/me/publication-eligibility')
      .set(authHeader())
      .expect(200);

    const body = response.body as {
      eligible: boolean;
      requirements: Array<{ code: string; satisfied: boolean }>;
    };

    expect(body.eligible).toBe(false);
    expect(
      body.requirements.find((item) => item.code === 'BIOGRAPHY')?.satisfied,
    ).toBe(false);
    expect(
      body.requirements.find((item) => item.code === 'IDENTITY_VERIFIED')
        ?.satisfied,
    ).toBe(false);
  });

  it('rejects publish with 422 when requirements are missing', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Not ready' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/mentors/me/publish')
      .set(authHeader())
      .expect(422);

    const body = response.body as {
      code: string;
      requirements: Array<{ code: string; satisfied: boolean }>;
    };
    expect(body.code).toBe('PUBLICATION_NOT_ELIGIBLE');
    expect(body.requirements.length).toBeGreaterThan(0);
  });

  it('publishes eligible mentor and marks them bookable', async () => {
    await createEligibleMentor(app, authHeader(), { englishId, skillId });

    const publishRes = await request(app.getHttpServer())
      .post('/mentors/me/publish')
      .set(authHeader())
      .expect(200);

    const published = publishRes.body as {
      publicationStatus: string;
      isBookable: boolean;
      publicationEligibility: { eligible: boolean };
    };

    expect(published.publicationStatus).toBe(PublicationStatus.PUBLISHED);
    expect(published.publicationEligibility.eligible).toBe(true);
    expect(published.isBookable).toBe(true);
  });

  it('unpublishes mentor and clears bookable status', async () => {
    await createEligibleMentor(app, authHeader(), { englishId, skillId });
    await request(app.getHttpServer())
      .post('/mentors/me/publish')
      .set(authHeader())
      .expect(200);

    const unpublishRes = await request(app.getHttpServer())
      .post('/mentors/me/unpublish')
      .set(authHeader())
      .expect(200);

    const unpublished = unpublishRes.body as {
      publicationStatus: string;
      isBookable: boolean;
    };

    expect(unpublished.publicationStatus).toBe(PublicationStatus.UNPUBLISHED);
    expect(unpublished.isBookable).toBe(false);
  });

  it('keeps published mentor not bookable when identity is not verified', async () => {
    await createEligibleMentor(app, authHeader(), {
      englishId,
      skillId,
      verifyIdentity: false,
    });

    await request(app.getHttpServer())
      .post('/mentors/me/publish')
      .set(authHeader())
      .expect(422);
  });
});

async function createEligibleMentor(
  app: INestApplication<App>,
  headers: Record<string, string>,
  options: {
    englishId: string;
    skillId: string;
    verifyIdentity?: boolean;
  },
): Promise<void> {
  await request(app.getHttpServer())
    .post('/mentors/profile')
    .set(headers)
    .send({
      displayName: 'Publication Mentor',
      headline: 'Automotive mentor',
      biography: 'Decades of workshop experience mentoring apprentices',
      timezone: 'Europe/Helsinki',
    })
    .expect(201);

  if (options.verifyIdentity !== false) {
    await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(headers)
      .expect(201);

    await request(app.getHttpServer())
      .post('/verifications/identity/stub-result')
      .set(headers)
      .send({ status: VerificationStatus.VERIFIED })
      .expect(200);
  }

  await request(app.getHttpServer())
    .put('/mentors/me/languages')
    .set(headers)
    .send({ languageIds: [options.englishId] })
    .expect(200);

  await request(app.getHttpServer())
    .post('/mentors/me/expertise')
    .set(headers)
    .send({
      skillId: options.skillId,
      yearsExperience: 25,
      description: 'Workshop mentor',
      teachingLevel: TeachingLevel.BEGINNER,
    })
    .expect(201);

  await request(app.getHttpServer())
    .put('/mentors/me/availability')
    .set(headers)
    .send({
      rules: [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '10:00',
          endTime: '13:00',
        },
      ],
    })
    .expect(200);
}

async function seedLanguages(
  prisma: PrismaService,
): Promise<{ englishId: string }> {
  const english = await prisma.language.upsert({
    where: { code: 'en' },
    create: {
      code: 'en',
      name: 'English',
      sortOrder: 1,
      status: LanguageStatus.ACTIVE,
    },
    update: { name: 'English', sortOrder: 1, status: LanguageStatus.ACTIVE },
  });

  return { englishId: english.id };
}

async function seedSkills(prisma: PrismaService): Promise<{ skillId: string }> {
  const category = await prisma.skillCategory.upsert({
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

  const skill = await prisma.skill.upsert({
    where: { slug: 'basic-car-maintenance' },
    create: {
      slug: 'basic-car-maintenance',
      name: 'Basic Car Maintenance',
      sortOrder: 1,
      status: CatalogueStatus.ACTIVE,
      categoryId: category.id,
    },
    update: {
      name: 'Basic Car Maintenance',
      sortOrder: 1,
      status: CatalogueStatus.ACTIVE,
      categoryId: category.id,
    },
  });

  return { skillId: skill.id };
}
