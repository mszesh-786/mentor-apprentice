import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
  Role,
  TeachingLevel,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Discovery (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let finnishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-discovery-mentor',
    email: 'e2e-discovery-mentor@example.com',
    displayName: 'Discovery Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-discovery-apprentice',
    email: 'e2e-discovery-apprentice@example.com',
    displayName: 'Discovery Apprentice',
    roles: [Role.APPRENTICE],
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
    finnishId = languages.finnishId;
    skillId = (await seedSkills(prisma)).skillId;
  });

  beforeEach(async () => {
    await cleanDiscoveryTables(prisma);
  });

  afterAll(async () => {
    await cleanDiscoveryTables(prisma);
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  it('lets a mentor also create an apprentice profile (dual role)', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(auth(mentorToken))
      .send({ headline: 'Also mentoring' })
      .expect(201);

    const createRes = await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(mentorToken))
      .send({ shortBio: 'Also learning', generalLocation: 'Helsinki' })
      .expect(201);

    expect(createRes.body).toMatchObject({
      shortBio: 'Also learning',
      generalLocation: 'Helsinki',
    });

    await request(app.getHttpServer())
      .get('/apprentices/me')
      .set(auth(mentorToken))
      .expect(200);
  });

  it('searches published bookable mentors by skill with match reasons', async () => {
    const profileId = await publishDiscoverableMentor(app, auth(mentorToken), {
      englishId,
      skillId,
      teachingLevel: TeachingLevel.BEGINNER,
    });

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprenticeToken))
      .send({ shortBio: 'Learner' })
      .expect(201);

    const searchRes = await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({ skillId })
      .set(auth(apprenticeToken))
      .expect(200);

    const results = searchRes.body as Array<{
      id: string;
      matchReasons: string[];
      identityVerified: boolean;
    }>;
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe(profileId);
    expect(results[0]?.identityVerified).toBe(true);
    expect(results[0]?.matchReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Teaches'),
        'Identity verified',
        'Available for booking',
      ]),
    );

    const events = await prisma.analyticsEvent.findMany({
      where: { type: 'SKILL_SEARCH' },
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('filters by language and teaching level', async () => {
    await publishDiscoverableMentor(app, auth(mentorToken), {
      englishId,
      skillId,
      teachingLevel: TeachingLevel.BEGINNER,
    });

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprenticeToken))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({ skillId, languageId: finnishId })
      .set(auth(apprenticeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([]);
      });

    await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({ skillId, teachingLevel: TeachingLevel.ADVANCED })
      .set(auth(apprenticeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([]);
      });

    await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({
        skillId,
        languageId: englishId,
        teachingLevel: TeachingLevel.BEGINNER,
      })
      .set(auth(apprenticeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
      });
  });

  it('excludes draft mentors from search', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(auth(mentorToken))
      .send({
        displayName: 'Draft Mentor',
        headline: 'Not published',
        biography: 'Bio',
        timezone: 'Europe/Helsinki',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprenticeToken))
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({ skillId })
      .set(auth(apprenticeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([]);
      });
  });

  it('excludes blocked mentors from search and detail', async () => {
    const profileId = await publishDiscoverableMentor(app, auth(mentorToken), {
      englishId,
      skillId,
      teachingLevel: TeachingLevel.BEGINNER,
    });

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprenticeToken))
      .send({})
      .expect(201);

    const mentorUser = await prisma.user.findUniqueOrThrow({
      where: { authProviderId: mentorToken.sub },
    });

    await request(app.getHttpServer())
      .post('/blocks')
      .set(auth(apprenticeToken))
      .send({ blockedUserId: mentorUser.id })
      .expect(201);

    await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({ skillId })
      .set(auth(apprenticeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([]);
      });

    await request(app.getHttpServer())
      .get(`/discovery/mentors/${profileId}`)
      .set(auth(apprenticeToken))
      .expect(404);
  });

  it('returns public mentor detail and records profile view', async () => {
    const profileId = await publishDiscoverableMentor(app, auth(mentorToken), {
      englishId,
      skillId,
      teachingLevel: TeachingLevel.BEGINNER,
    });

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprenticeToken))
      .send({})
      .expect(201);

    const detailRes = await request(app.getHttpServer())
      .get(`/discovery/mentors/${profileId}`)
      .set(auth(apprenticeToken))
      .expect(200);

    expect(detailRes.body).toMatchObject({
      id: profileId,
      identityVerified: true,
      expertise: [
        expect.objectContaining({
          skillId,
          teachingLevel: TeachingLevel.BEGINNER,
        }),
      ],
    });
    expect(
      (detailRes.body as { availability: unknown[] }).availability.length,
    ).toBeGreaterThan(0);
    expect(detailRes.body).not.toHaveProperty('email');
    expect(detailRes.body).not.toHaveProperty('authProviderId');

    const views = await prisma.analyticsEvent.findMany({
      where: { type: 'MENTOR_PROFILE_VIEW' },
    });
    expect(views.length).toBeGreaterThan(0);
  });

  it('rejects discovery without APPRENTICE role', async () => {
    await request(app.getHttpServer())
      .get('/discovery/mentors')
      .query({ skillId })
      .set(auth(mentorToken))
      .expect(403);
  });
});

async function publishDiscoverableMentor(
  app: INestApplication<App>,
  headers: Record<string, string>,
  options: {
    englishId: string;
    skillId: string;
    teachingLevel: TeachingLevel;
  },
): Promise<string> {
  const createRes = await request(app.getHttpServer())
    .post('/mentors/profile')
    .set(headers)
    .send({
      displayName: 'Discovery Mentor',
      headline: 'Automotive mentor',
      biography: 'Decades of workshop experience mentoring apprentices',
      timezone: 'Europe/Helsinki',
    })
    .expect(201);

  await request(app.getHttpServer())
    .post('/verifications/identity')
    .set(headers)
    .expect(201);

  await request(app.getHttpServer())
    .post('/verifications/identity/stub-result')
    .set(headers)
    .send({ status: VerificationStatus.VERIFIED })
    .expect(200);

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
      teachingLevel: options.teachingLevel,
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

  await request(app.getHttpServer())
    .post('/mentors/me/publish')
    .set(headers)
    .expect(200);

  return (createRes.body as { id: string }).id;
}

async function cleanDiscoveryTables(prisma: PrismaService): Promise<void> {
  await prisma.analyticsEvent.deleteMany();
  await prisma.sessionSummary.deleteMany();
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.userBlock.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.mentorExpertise.deleteMany();
  await prisma.mentorLanguage.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.apprenticeProfile.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.user.deleteMany();
}

async function seedLanguages(
  prisma: PrismaService,
): Promise<{ englishId: string; finnishId: string }> {
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
  const finnish = await prisma.language.upsert({
    where: { code: 'fi' },
    create: {
      code: 'fi',
      name: 'Finnish',
      sortOrder: 2,
      status: LanguageStatus.ACTIVE,
    },
    update: { name: 'Finnish', sortOrder: 2, status: LanguageStatus.ACTIVE },
  });
  return { englishId: english.id, finnishId: finnish.id };
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
