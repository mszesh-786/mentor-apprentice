import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
  MentorshipStatus,
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

describe('Mentorships (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-mentorship-mentor',
    email: 'e2e-mentorship-mentor@example.com',
    displayName: 'Mentorship Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-mentorship-apprentice',
    email: 'e2e-mentorship-apprentice@example.com',
    displayName: 'Mentorship Apprentice',
    roles: [Role.APPRENTICE],
    emailVerified: true,
  };

  const outsiderToken = {
    sub: 'e2e-mentorship-outsider',
    email: 'e2e-mentorship-outsider@example.com',
    displayName: 'Outsider',
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
    await cleanMentorshipTables(prisma);
  });

  afterAll(async () => {
    await cleanMentorshipTables(prisma);
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  async function completedSessionFlow(): Promise<{
    mentorProfileId: string;
    bookingId: string;
    sessionId: string;
    mentorUserId: string;
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

    const bookingId = (booking.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/bookings/${bookingId}/accept`)
      .set(auth(mentorToken))
      .expect(200);

    const session = await request(app.getHttpServer())
      .get(`/bookings/${bookingId}/session`)
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
      .set(auth(mentorToken))
      .expect(200);

    const mentorUser = await prisma.user.findUniqueOrThrow({
      where: { authProviderId: mentorToken.sub },
    });

    return {
      mentorProfileId,
      bookingId,
      sessionId,
      mentorUserId: mentorUser.id,
    };
  }

  it('enforces continue gates and links booking; auto-attaches future bookings', async () => {
    const { mentorProfileId, bookingId, sessionId, mentorUserId } =
      await completedSessionFlow();

    await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/continue`)
      .set(auth(outsiderToken))
      .send({})
      .expect(403);

    // recreate a READY session path: continue on completed is required —
    // non-completed checked via a fresh accepted booking without complete
    const secondBooking = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt: '2026-08-24T07:30:00.000Z',
        durationMinutes: 30,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/bookings/${(secondBooking.body as { id: string }).id}/accept`)
      .set(auth(mentorToken))
      .expect(200);
    const readySession = await request(app.getHttpServer())
      .get(`/bookings/${(secondBooking.body as { id: string }).id}/session`)
      .set(auth(apprenticeToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/sessions/${(readySession.body as { id: string }).id}/continue`)
      .set(auth(apprenticeToken))
      .send({})
      .expect(409);

    const continued = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/continue`)
      .set(auth(apprenticeToken))
      .send({ title: 'Routine maintenance confidence' })
      .expect(201);

    expect(continued.body).toMatchObject({
      status: MentorshipStatus.ACTIVE,
      primarySkillId: skillId,
    });
    const mentorshipId = (continued.body as { id: string }).id;

    const linked = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });
    expect(linked.relationshipId).toBe(mentorshipId);

    const again = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/continue`)
      .set(auth(mentorToken))
      .send({})
      .expect(201);
    expect((again.body as { id: string }).id).toBe(mentorshipId);

    const nextBooking = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt: '2026-08-31T07:00:00.000Z',
        durationMinutes: 30,
      })
      .expect(201);
    expect(
      (nextBooking.body as { relationshipId: string }).relationshipId,
    ).toBe(mentorshipId);

    await request(app.getHttpServer())
      .post(`/mentorships/${mentorshipId}/pause`)
      .set(auth(mentorToken))
      .expect(200);

    const pausedBooking = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt: '2026-08-31T07:30:00.000Z',
        durationMinutes: 30,
      })
      .expect(201);
    expect(
      (pausedBooking.body as { relationshipId: string | null }).relationshipId,
    ).toBeNull();

    await request(app.getHttpServer())
      .get(`/mentorships/${mentorshipId}`)
      .set(auth(outsiderToken))
      .expect(403);

    await request(app.getHttpServer())
      .post(`/mentorships/${mentorshipId}/resume`)
      .set(auth(apprenticeToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/mentorships/${mentorshipId}/complete`)
      .set(auth(mentorToken))
      .expect(200);

    const afterComplete = await request(app.getHttpServer())
      .get(`/mentorships/${mentorshipId}`)
      .set(auth(apprenticeToken))
      .expect(200);
    expect(afterComplete.body).toMatchObject({
      status: MentorshipStatus.COMPLETED,
    });

    const history = await request(app.getHttpServer())
      .get(`/mentorships/${mentorshipId}/bookings`)
      .set(auth(apprenticeToken))
      .expect(200);
    expect((history.body as unknown[]).length).toBeGreaterThanOrEqual(1);

    void mentorUserId;
    void SessionStatus;
    void BookingStatus;
  });

  it('block ends active relationship; history remains readable by participants', async () => {
    const { sessionId, mentorUserId } = await completedSessionFlow();

    const continued = await request(app.getHttpServer())
      .post(`/sessions/${sessionId}/continue`)
      .set(auth(apprenticeToken))
      .send({})
      .expect(201);
    const mentorshipId = (continued.body as { id: string }).id;

    await request(app.getHttpServer())
      .post('/blocks')
      .set(auth(apprenticeToken))
      .send({ blockedUserId: mentorUserId })
      .expect(201);

    const ended = await request(app.getHttpServer())
      .get(`/mentorships/${mentorshipId}`)
      .set(auth(apprenticeToken))
      .expect(200);

    expect(ended.body).toMatchObject({ status: MentorshipStatus.ENDED });

    await request(app.getHttpServer())
      .get(`/mentorships/${mentorshipId}/sessions`)
      .set(auth(mentorToken))
      .expect(200);
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
      displayName: 'Mentorship Mentor',
      headline: 'Mentorship mentor',
      biography: 'Experienced mentor for mentorship tests',
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

async function cleanMentorshipTables(prisma: PrismaService): Promise<void> {
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
