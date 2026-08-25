import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CatalogueStatus,
  DayOfWeek,
  LanguageStatus,
  NotificationType,
  Role,
  TeachingLevel,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let skillId: string;

  const mentorToken = {
    sub: 'e2e-notify-mentor',
    email: 'e2e-notify-mentor@example.com',
    displayName: 'Notify Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-notify-apprentice',
    email: 'e2e-notify-apprentice@example.com',
    displayName: 'Notify Apprentice',
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
    await cleanTables(prisma);
  });

  afterAll(async () => {
    await cleanTables(prisma);
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  it('notifies mentor on booking request and supports read flow', async () => {
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

    const unread = await request(app.getHttpServer())
      .get('/notifications/me/unread-count')
      .set(auth(mentorToken))
      .expect(200);

    expect(unread.body).toEqual({ count: 1 });

    const list = await request(app.getHttpServer())
      .get('/notifications/me')
      .set(auth(mentorToken))
      .expect(200);

    expect(list.body).toEqual([
      expect.objectContaining({
        type: NotificationType.BOOKING_REQUESTED,
        relatedEntityId: (booking.body as { id: string }).id,
        status: 'UNREAD',
      }),
    ]);

    const notificationId = (list.body as Array<{ id: string }>)[0]!.id;

    await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set(auth(mentorToken))
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('READ');
      });

    await request(app.getHttpServer())
      .get('/notifications/me/unread-count')
      .set(auth(mentorToken))
      .expect(200)
      .expect((res) => {
        expect(res.body.count).toBe(0);
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
      displayName: 'Notify Mentor',
      headline: 'Notify mentor',
      biography: 'Experienced mentor for notification tests',
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
  await prisma.notification.deleteMany();
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
