import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Users auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const token = {
    sub: 'e2e-auth-user',
    email: 'e2e-auth-user@example.com',
    displayName: 'Auth User',
    roles: [] as Role[],
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
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  function auth(payload: Record<string, unknown>) {
    return { Authorization: `Bearer ${jwtService.sign(payload)}` };
  }

  it('creates user on first request and supports role selection', async () => {
    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set(auth(token))
      .expect(200);

    expect(me.body).toMatchObject({
      email: token.email,
      needsRoleSelection: true,
      roles: [],
    });

    const updated = await request(app.getHttpServer())
      .post('/users/me/roles')
      .set(auth(token))
      .send({ roles: [Role.MENTOR, Role.APPRENTICE] })
      .expect(200);

    expect(updated.body.needsRoleSelection).toBe(false);
    expect(updated.body.roles).toEqual(
      expect.arrayContaining([Role.MENTOR, Role.APPRENTICE]),
    );
  });
});
