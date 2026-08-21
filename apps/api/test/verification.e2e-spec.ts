import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, VerificationStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('VerificationController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mentorTokenPayload = {
    sub: 'e2e-verify-mentor',
    email: 'e2e-verify-mentor@example.com',
    displayName: 'Verify Mentor',
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
  });

  afterAll(async () => {
    await prisma.analyticsEvent.deleteMany();
    await prisma.sessionSummary.deleteMany();
    await prisma.session.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availabilityException.deleteMany();
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
    await request(app.getHttpServer()).get('/verifications/me').expect(401);
  });

  it('returns NOT_STARTED before a mentor starts verification', async () => {
    const response = await request(app.getHttpServer())
      .get('/verifications/me')
      .set(authHeader())
      .expect(200);

    const body = response.body as { status: string; type: string };
    expect(body.status).toBe(VerificationStatus.NOT_STARTED);
    expect(body.type).toBe('IDENTITY');
  });

  it('lets any authenticated user read own identity status', async () => {
    const response = await request(app.getHttpServer())
      .get('/verifications/me')
      .set(
        authHeader({
          sub: 'e2e-verify-apprentice',
          email: 'apprentice-verify@example.com',
          roles: [Role.APPRENTICE],
        }),
      )
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe(VerificationStatus.NOT_STARTED);
  });

  it('rejects start without MENTOR role', async () => {
    await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(
        authHeader({
          sub: 'e2e-verify-apprentice',
          email: 'apprentice-verify@example.com',
          roles: [Role.APPRENTICE],
        }),
      )
      .expect(403);
  });

  it('starts identity verification and applies stub VERIFIED', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Unverified mentor' })
      .expect(201);

    const startRes = await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(authHeader())
      .expect(201);

    const started = startRes.body as { status: string };
    expect(started.status).toBe(VerificationStatus.PENDING);

    await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(authHeader())
      .expect(409);

    const stubRes = await request(app.getHttpServer())
      .post('/verifications/identity/stub-result')
      .set(authHeader())
      .send({ status: VerificationStatus.VERIFIED })
      .expect(200);

    expect(stubRes.body).toMatchObject({
      status: VerificationStatus.VERIFIED,
      type: 'IDENTITY',
    });

    const meRes = await request(app.getHttpServer())
      .get('/mentors/me')
      .set(authHeader())
      .expect(200);

    const me = meRes.body as {
      identityVerification: { status: string };
    };
    expect(me.identityVerification.status).toBe(VerificationStatus.VERIFIED);
  });

  it('does not treat FAILED as verified', async () => {
    await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(authHeader())
      .expect(201);

    await request(app.getHttpServer())
      .post('/verifications/identity/stub-result')
      .set(authHeader())
      .send({ status: VerificationStatus.FAILED })
      .expect(200);

    const meRes = await request(app.getHttpServer())
      .get('/verifications/me')
      .set(authHeader())
      .expect(200);

    const body = meRes.body as { status: string };
    expect(body.status).toBe(VerificationStatus.FAILED);
    expect(body.status).not.toBe(VerificationStatus.VERIFIED);

    const retryRes = await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(authHeader())
      .expect(201);

    const retried = retryRes.body as { status: string };
    expect(retried.status).toBe(VerificationStatus.PENDING);
  });

  it('rejects restart when REQUIRES_REVIEW', async () => {
    await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(authHeader())
      .expect(201);

    await request(app.getHttpServer())
      .post('/verifications/identity/stub-result')
      .set(authHeader())
      .send({ status: VerificationStatus.REQUIRES_REVIEW })
      .expect(200);

    await request(app.getHttpServer())
      .post('/verifications/identity')
      .set(authHeader())
      .expect(409);
  });
});
