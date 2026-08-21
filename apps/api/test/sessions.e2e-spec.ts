import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AnalyticsEventType,
  BookingStatus,
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
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

describe('Sessions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-session-mentor',
    email: 'e2e-session-mentor@example.com',
    displayName: 'Session Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-session-apprentice',
    email: 'e2e-session-apprentice@example.com',
    displayName: 'Session Apprentice',
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
    await cleanSessionTables(prisma);
  });

  afterAll(async () => {
    await cleanSessionTables(prisma);
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  async function acceptedBooking(): Promise<{
    bookingId: string;
    sessionId: string;
  }> {
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
        startAt: '2026-08-24T07:00:00.000Z',
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

    return {
      bookingId: (booking.body as { id: string }).id,
      sessionId: (session.body as { id: string }).id,
    };
  }

  it('creates session on accept, joins, completes, and allows mentor summary', async () => {
    const { bookingId, sessionId } = await acceptedBooking();

    const created = await request(app.getHttpServer())
      .get(`/sessions/${sessionId}`)
      .set(auth(mentorToken))
      .expect(200);

    expect(created.body).toMatchObject({
      status: SessionStatus.READY,
      bookingId,
      videoProvider: 'STUB',
    });
    expect((created.body as { joinUrl: string }).joinUrl).toContain('stub-');

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/complete`)
      .set(auth(mentorToken))
      .expect(409);

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set(auth(mentorToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set(auth(apprenticeToken))
      .expect(200);

    const completed = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/complete`)
      .set(auth(apprenticeToken))
      .expect(200);

    expect(completed.body).toMatchObject({
      status: SessionStatus.COMPLETED,
    });

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });
    expect(booking.status).toBe(BookingStatus.COMPLETED);

    await request(app.getHttpServer())
      .put(`/sessions/${sessionId}/summary`)
      .set(auth(apprenticeToken))
      .send({ summary: 'Nope' })
      .expect(403);

    const withSummary = await request(app.getHttpServer())
      .put(`/sessions/${sessionId}/summary`)
      .set(auth(mentorToken))
      .send({
        summary: 'Covered oil changes',
        nextStep: 'Practice filter swap',
      })
      .expect(200);

    expect(withSummary.body).toMatchObject({
      summary: {
        summary: 'Covered oil changes',
        nextStep: 'Practice filter swap',
      },
    });

    const events = await prisma.analyticsEvent.findMany({
      where: {
        type: {
          in: [
            AnalyticsEventType.SESSION_JOINED,
            AnalyticsEventType.SESSION_COMPLETED,
          ],
        },
      },
    });
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('marks no-show with absent participant', async () => {
    const { bookingId, sessionId } = await acceptedBooking();

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/join`)
      .set(auth(mentorToken))
      .expect(200);

    const noShow = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/report-no-show`)
      .set(auth(mentorToken))
      .expect(200);

    expect(noShow.body).toMatchObject({
      status: SessionStatus.FAILED,
      failureReason: 'NO_SHOW',
    });
    expect((noShow.body as { absentUserId: string }).absentUserId).toBeTruthy();

    const bookingNoShow = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });
    expect(bookingNoShow.status).toBe(BookingStatus.NO_SHOW);
  });

  it('terminates booking on technical failure', async () => {
    const { bookingId, sessionId } = await acceptedBooking();

    const failed = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/report-technical-failure`)
      .set(auth(apprenticeToken))
      .expect(200);

    expect(failed.body).toMatchObject({
      status: SessionStatus.FAILED,
      failureReason: 'TECHNICAL_FAILURE',
    });

    const bookingFailed = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });
    expect(bookingFailed.status).toBe(BookingStatus.CANCELLED);
    expect(bookingFailed.cancelReason).toBe('TECHNICAL_FAILURE');
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
      displayName: 'Session Mentor',
      headline: 'Session mentor',
      biography: 'Experienced mentor for session tests',
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

async function cleanSessionTables(prisma: PrismaService): Promise<void> {
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
