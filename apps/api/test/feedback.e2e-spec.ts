import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
  ProductFeedbackCategory,
  Role,
  SessionStatus,
  TeachingLevel,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Feedback (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-feedback-mentor',
    email: 'e2e-feedback-mentor@example.com',
    displayName: 'Feedback Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-feedback-apprentice',
    email: 'e2e-feedback-apprentice@example.com',
    displayName: 'Feedback Apprentice',
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
    await cleanFeedbackTables(prisma);
  });

  afterAll(async () => {
    await cleanFeedbackTables(prisma);
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

  it('allows apprentice and mentor feedback on completed session', async () => {
    const sessionId = await completedSession();

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/feedback`)
      .set(auth(apprenticeToken))
      .send({
        wasUseful: true,
        explanationsClear: true,
        progressMade: true,
        wouldBookAgain: true,
        comment: 'Great session',
      })
      .expect(201);

    const sessionAfter = await request(app.getHttpServer())
      .get(`/sessions/${sessionId}`)
      .set(auth(apprenticeToken))
      .expect(200);

    expect(sessionAfter.body).toMatchObject({
      status: SessionStatus.COMPLETED,
      myFeedbackSubmitted: true,
    });

    await request(app.getHttpServer())
      .get(`/sessions/${sessionId}/feedback/me`)
      .set(auth(apprenticeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          sessionId,
          role: 'APPRENTICE',
          wasUseful: true,
        });
      });

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/feedback`)
      .set(auth(apprenticeToken))
      .send({
        wasUseful: false,
        explanationsClear: false,
        progressMade: false,
        wouldBookAgain: false,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/feedback`)
      .set(auth(mentorToken))
      .send({
        apprenticeRespectful: true,
        learningGoalClear: true,
        wouldMentorAgain: true,
      })
      .expect(201);
  });

  it('rejects feedback before completion', async () => {
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

    const readySession = await request(app.getHttpServer())
      .get(`/bookings/${(booking.body as { id: string }).id}/session`)
      .set(auth(apprenticeToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(
        `/sessions/${(readySession.body as { id: string }).id}/feedback`,
      )
      .set(auth(apprenticeToken))
      .send({
        wasUseful: true,
        explanationsClear: true,
        progressMade: true,
        wouldBookAgain: true,
      })
      .expect(400);
  });

  it('accepts product feedback', async () => {
    await request(app.getHttpServer())
      .post('/feedback/product')
      .set(auth(apprenticeToken))
      .send({
        category: ProductFeedbackCategory.CONFUSING,
        message: 'Could not find my bookings',
        pageContext: '/apprentice/bookings',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toMatchObject({
          category: ProductFeedbackCategory.CONFUSING,
          message: 'Could not find my bookings',
          pageContext: '/apprentice/bookings',
        });
      });
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
      displayName: 'Feedback Mentor',
      headline: 'Feedback mentor',
      biography: 'Experienced mentor for feedback tests',
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

async function cleanFeedbackTables(prisma: PrismaService): Promise<void> {
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
