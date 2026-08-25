import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
  Role,
  SessionStatus,
  TeachingLevel,
  UserReportReason,
  UserReportStatus,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Reports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-reports-mentor',
    email: 'e2e-reports-mentor@example.com',
    displayName: 'Reports Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-reports-apprentice',
    email: 'e2e-reports-apprentice@example.com',
    displayName: 'Reports Apprentice',
    roles: [Role.APPRENTICE],
    emailVerified: true,
  };

  const strangerToken = {
    sub: 'e2e-reports-stranger',
    email: 'e2e-reports-stranger@example.com',
    displayName: 'Stranger',
    roles: [Role.APPRENTICE],
    emailVerified: true,
  };

  beforeAll(async () => {
    process.env.SESSION_JOIN_OPEN_MINUTES_BEFORE = '100000';
    process.env.SESSION_JOIN_CLOSE_MINUTES_AFTER_END = '100000';

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

    englishId = (await seedLanguages(prisma)).englishId;
    skillId = (await seedSkills(prisma)).skillId;
  });

  beforeEach(async () => {
    await cleanTables(prisma);
  });

  afterAll(async () => {
    await cleanTables(prisma);
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  async function completedSession(): Promise<string> {
    const mentorProfileId = await publishBookableMentor(
      app,
      auth(mentorToken),
      englishId,
      skillId,
    );

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprenticeToken))
      .send({ shortBio: 'Learner' })
      .expect(201);

    const booking = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt: '2026-09-07T07:00:00.000Z',
        durationMinutes: 30,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/bookings/${(booking.body as { id: string }).id}/accept`)
      .set(auth(mentorToken))
      .expect(200);

    const session = await request(app.getHttpServer())
      .get(`/bookings/${(booking.body as { id: string }).id}/session`)
      .set(auth(apprenticeToken))
      .expect(200);

    const sessionId = (session.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set(auth(mentorToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set(auth(apprenticeToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/complete`)
      .set(auth(apprenticeToken))
      .expect(200);

    return sessionId;
  }

  it('submits and lists session-scoped reports', async () => {
    const sessionId = await completedSession();

    const session = await request(app.getHttpServer())
      .get(`/sessions/${sessionId}`)
      .set(auth(apprenticeToken))
      .expect(200);

    const mentorUserId = (session.body as { mentorUserId: string }).mentorUserId;

    const created = await request(app.getHttpServer())
      .post('/reports')
      .set(auth(apprenticeToken))
      .send({
        reportedUserId: mentorUserId,
        reason: UserReportReason.HARASSMENT,
        description: 'The mentor behaved inappropriately during our session.',
        sessionId,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      reportedUserId: mentorUserId,
      sessionId,
      reason: UserReportReason.HARASSMENT,
      status: UserReportStatus.OPEN,
    });

    const list = await request(app.getHttpServer())
      .get('/reports/me')
      .set(auth(apprenticeToken))
      .expect(200);

    expect(list.body).toEqual([
      expect.objectContaining({
        reportedDisplayName: 'Reports Mentor',
        status: UserReportStatus.OPEN,
      }),
    ]);

    await request(app.getHttpServer())
      .post('/reports')
      .set(auth(apprenticeToken))
      .send({
        reportedUserId: mentorUserId,
        reason: UserReportReason.OTHER,
        description: 'Trying to submit a duplicate open report.',
        sessionId,
      })
      .expect(409);
  });

  it('rejects reports without platform interaction', async () => {
    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(strangerToken))
      .send({ shortBio: 'Stranger' })
      .expect(201);

    await publishBookableMentor(app, auth(mentorToken), englishId, skillId);

    const mentorUser = await prisma.user.findUniqueOrThrow({
      where: { authProviderId: mentorToken.sub },
    });

    await request(app.getHttpServer())
      .post('/reports')
      .set(auth(strangerToken))
      .send({
        reportedUserId: mentorUser.id,
        reason: UserReportReason.SPAM,
        description: 'This user looks suspicious on the platform.',
      })
      .expect(403);
  });
});

async function publishBookableMentor(
  app: INestApplication<App>,
  headers: Record<string, string>,
  languageId: string,
  skillId: string,
): Promise<string> {
  const createRes = await request(app.getHttpServer())
    .post('/mentors/profile')
    .set(headers)
    .send({
      displayName: 'Reports Mentor',
      headline: 'Reports mentor',
      biography: 'Experienced mentor for reports tests',
      timezone: 'Europe/Helsinki',
    })
    .expect(201);

  await request(app.getHttpServer())
    .put('/mentors/me/languages')
    .set(headers)
    .send({ languageIds: [languageId] })
    .expect(200);

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
    .post('/mentors/me/expertise')
    .set(headers)
    .send({
      skillId,
      yearsExperience: 12,
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

  await request(app.getHttpServer())
    .post('/mentors/me/publish')
    .set(headers)
    .expect(200);

  return (createRes.body as { id: string }).id;
}

async function cleanTables(prisma: PrismaService): Promise<void> {
  await prisma.userReport.deleteMany();
  await prisma.productFeedback.deleteMany();
  await prisma.sessionFeedback.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.sessionSummary.deleteMany();
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.mentorshipGoal.deleteMany();
  await prisma.mentorshipRelationship.deleteMany();
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
