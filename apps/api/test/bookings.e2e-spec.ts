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
  TeachingLevel,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Bookings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-booking-mentor',
    email: 'e2e-booking-mentor@example.com',
    displayName: 'Booking Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-booking-apprentice',
    email: 'e2e-booking-apprentice@example.com',
    displayName: 'Booking Apprentice',
    roles: [Role.APPRENTICE],
    emailVerified: true,
  };

  const apprentice2Token = {
    sub: 'e2e-booking-apprentice-2',
    email: 'e2e-booking-apprentice-2@example.com',
    displayName: 'Booking Apprentice 2',
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

    englishId = (await seedLanguages(prisma)).englishId;
    skillId = (await seedSkills(prisma)).skillId;
  });

  beforeEach(async () => {
    await cleanBookingTables(prisma);
  });

  afterAll(async () => {
    await cleanBookingTables(prisma);
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  it('requests, accepts, auto-declines conflict, and respects exceptions', async () => {
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

    await request(app.getHttpServer())
      .post('/apprentices/profile')
      .set(auth(apprentice2Token))
      .send({ shortBio: 'Learner 2' })
      .expect(201);

    const startAt = '2026-08-24T07:00:00.000Z';

    const first = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt,
        durationMinutes: 30,
        apprenticeMessage: 'Need oil change tips',
      })
      .expect(201);

    expect((first.body as { status: string }).status).toBe(
      BookingStatus.REQUESTED,
    );

    const second = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprentice2Token))
      .send({
        mentorProfileId,
        skillId,
        startAt,
        durationMinutes: 30,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/bookings/${(first.body as { id: string }).id}/accept`)
      .set(auth(mentorToken))
      .expect(200);

    const declined = await request(app.getHttpServer())
      .get(`/bookings/${(second.body as { id: string }).id}`)
      .set(auth(apprentice2Token))
      .expect(200);

    expect(declined.body).toMatchObject({
      status: BookingStatus.DECLINED,
      declineReason: 'CONFLICT',
    });

    await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprentice2Token))
      .send({
        mentorProfileId,
        skillId,
        startAt,
        durationMinutes: 30,
      })
      .expect(409);

    await request(app.getHttpServer())
      .post('/mentors/me/availability-exceptions')
      .set(auth(mentorToken))
      .send({ date: '2026-08-31', startTime: '10:00', endTime: '11:00' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt: '2026-08-31T07:00:00.000Z',
        durationMinutes: 30,
      })
      .expect(400);

    const slots = await request(app.getHttpServer())
      .get(`/discovery/mentors/${mentorProfileId}/slots`)
      .query({
        from: '2026-08-24T06:00:00.000Z',
        to: '2026-08-24T10:00:00.000Z',
        durationMinutes: 30,
      })
      .set(auth(apprenticeToken))
      .expect(200);

    expect(
      (slots.body as Array<{ startAt: string }>).some(
        (slot) => slot.startAt === startAt,
      ),
    ).toBe(false);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        type: {
          in: [
            AnalyticsEventType.BOOKING_REQUESTED,
            AnalyticsEventType.BOOKING_ACCEPTED,
          ],
        },
      },
    });
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it('lets mentor decline and apprentice cancel', async () => {
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

    const created = await request(app.getHttpServer())
      .post('/bookings')
      .set(auth(apprenticeToken))
      .send({
        mentorProfileId,
        skillId,
        startAt: '2026-08-24T07:00:00.000Z',
        durationMinutes: 15,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/bookings/${(created.body as { id: string }).id}/decline`)
      .set(auth(mentorToken))
      .expect(200);

    const second = await request(app.getHttpServer())
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
      .post(`/bookings/${(second.body as { id: string }).id}/accept`)
      .set(auth(mentorToken))
      .expect(200);

    await request(app.getHttpServer())
      .post(`/bookings/${(second.body as { id: string }).id}/cancel`)
      .set(auth(apprenticeToken))
      .expect(200);

    const mine = await request(app.getHttpServer())
      .get('/bookings/me')
      .set(auth(apprenticeToken))
      .expect(200);

    expect((mine.body as unknown[]).length).toBeGreaterThanOrEqual(2);
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
      displayName: 'Booking Mentor',
      headline: 'Booking mentor',
      biography: 'Experienced mentor available for booking tests',
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

async function cleanBookingTables(prisma: PrismaService): Promise<void> {
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
