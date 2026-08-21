import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { DayOfWeek, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('AvailabilityController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mentorTokenPayload = {
    sub: 'e2e-availability-mentor',
    email: 'e2e-availability-mentor@example.com',
    displayName: 'Availability Mentor',
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

  it('returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/mentors/me/availability')
      .expect(401);
  });

  it('returns empty availability before rules are set', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({
        headline: 'Mentor with schedule',
        timezone: 'Europe/Helsinki',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/mentors/me/availability')
      .set(authHeader())
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('replaces weekly availability and reflects hasAvailability on profile', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({
        headline: 'Scheduled mentor',
        timezone: 'Europe/Helsinki',
      })
      .expect(201);

    const putRes = await request(app.getHttpServer())
      .put('/mentors/me/availability')
      .set(authHeader())
      .send({
        rules: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '10:00',
            endTime: '13:00',
          },
          {
            dayOfWeek: DayOfWeek.WEDNESDAY,
            startTime: '14:00',
            endTime: '18:00',
          },
        ],
      })
      .expect(200);

    const rules = putRes.body as Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      timezone: string;
    }>;
    expect(rules).toHaveLength(2);
    expect(rules[0]).toMatchObject({
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '10:00',
      endTime: '13:00',
      timezone: 'Europe/Helsinki',
    });

    const meRes = await request(app.getHttpServer())
      .get('/mentors/me')
      .set(authHeader())
      .expect(200);

    const me = meRes.body as { hasAvailability: boolean };
    expect(me.hasAvailability).toBe(true);
  });

  it('rejects overlapping availability windows', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Overlap mentor', timezone: 'Europe/Helsinki' })
      .expect(201);

    await request(app.getHttpServer())
      .put('/mentors/me/availability')
      .set(authHeader())
      .send({
        rules: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '10:00',
            endTime: '12:00',
          },
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '11:00',
            endTime: '13:00',
          },
        ],
      })
      .expect(400);
  });

  it('deletes a single availability rule', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Delete rule mentor', timezone: 'Europe/Helsinki' })
      .expect(201);

    const putRes = await request(app.getHttpServer())
      .put('/mentors/me/availability')
      .set(authHeader())
      .send({
        rules: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            startTime: '10:00',
            endTime: '13:00',
          },
          {
            dayOfWeek: DayOfWeek.FRIDAY,
            startTime: '09:00',
            endTime: '12:00',
          },
        ],
      })
      .expect(200);

    const created = putRes.body as Array<{ id: string; dayOfWeek: string }>;
    const mondayRuleId = created.find(
      (rule) => rule.dayOfWeek === DayOfWeek.MONDAY,
    )?.id;
    expect(mondayRuleId).toBeDefined();

    const deleteRes = await request(app.getHttpServer())
      .delete(`/mentors/me/availability/${mondayRuleId}`)
      .set(authHeader())
      .expect(200);

    const remaining = deleteRes.body as Array<{ dayOfWeek: string }>;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.dayOfWeek).toBe(DayOfWeek.FRIDAY);

    const meRes = await request(app.getHttpServer())
      .get('/mentors/me')
      .set(authHeader())
      .expect(200);

    const me = meRes.body as { hasAvailability: boolean };
    expect(me.hasAvailability).toBe(true);
  });
});
