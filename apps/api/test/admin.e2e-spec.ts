import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Role,
  UserReportReason,
  UserReportResolutionOutcome,
  UserReportStatus,
  UserStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Admin (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const adminToken = {
    sub: 'e2e-admin',
    email: 'e2e-admin@example.com',
    displayName: 'E2E Admin',
    roles: [Role.ADMIN],
    emailVerified: true,
  };

  const mentorToken = {
    sub: 'e2e-admin-mentor',
    email: 'e2e-admin-mentor@example.com',
    displayName: 'Admin Wave Mentor',
    roles: [Role.MENTOR],
    emailVerified: true,
  };

  const apprenticeToken = {
    sub: 'e2e-admin-apprentice',
    email: 'e2e-admin-apprentice@example.com',
    displayName: 'Admin Wave Apprentice',
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

  async function ensureUsers() {
    await request(app.getHttpServer())
      .get('/users/me')
      .set(auth(adminToken))
      .expect(200);
    await request(app.getHttpServer())
      .get('/users/me')
      .set(auth(mentorToken))
      .expect(200);
    await request(app.getHttpServer())
      .get('/users/me')
      .set(auth(apprenticeToken))
      .expect(200);
  }

  it('forbids non-admin from admin endpoints', async () => {
    await ensureUsers();
    await request(app.getHttpServer())
      .get('/admin/users')
      .set(auth(mentorToken))
      .expect(403);
  });

  it('lists users and suspends / unsuspends', async () => {
    await ensureUsers();

    const list = await request(app.getHttpServer())
      .get('/admin/users')
      .set(auth(adminToken))
      .expect(200);

    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: mentorToken.email,
          status: UserStatus.ACTIVE,
        }),
      ]),
    );

    const mentor = await prisma.user.findUniqueOrThrow({
      where: { authProviderId: mentorToken.sub },
    });

    const suspended = await request(app.getHttpServer())
      .post(`/admin/users/${mentor.id}/suspend`)
      .set(auth(adminToken))
      .expect(200);

    expect(suspended.body).toMatchObject({
      id: mentor.id,
      status: UserStatus.SUSPENDED,
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set(auth(mentorToken))
      .expect(200)
      .expect((res) => {
        expect((res.body as { status: string }).status).toBe(
          UserStatus.SUSPENDED,
        );
      });

    const unsuspended = await request(app.getHttpServer())
      .post(`/admin/users/${mentor.id}/unsuspend`)
      .set(auth(adminToken))
      .expect(200);

    expect((unsuspended.body as { status: string }).status).toBe(
      UserStatus.ACTIVE,
    );
  });

  it('resolves open report with USER_SUSPENDED', async () => {
    await ensureUsers();

    const mentor = await prisma.user.findUniqueOrThrow({
      where: { authProviderId: mentorToken.sub },
    });
    const apprentice = await prisma.user.findUniqueOrThrow({
      where: { authProviderId: apprenticeToken.sub },
    });

    const report = await prisma.userReport.create({
      data: {
        reporterUserId: apprentice.id,
        reportedUserId: mentor.id,
        reason: UserReportReason.HARASSMENT,
        description: 'Mentor behaved poorly during our completed booking.',
        status: UserReportStatus.OPEN,
      },
    });

    const openList = await request(app.getHttpServer())
      .get('/admin/reports?status=OPEN')
      .set(auth(adminToken))
      .expect(200);

    expect(openList.body).toEqual([
      expect.objectContaining({
        id: report.id,
        status: UserReportStatus.OPEN,
      }),
    ]);

    const resolved = await request(app.getHttpServer())
      .post(`/admin/reports/${report.id}/resolve`)
      .set(auth(adminToken))
      .send({
        outcome: UserReportResolutionOutcome.USER_SUSPENDED,
        note: 'Confirmed after review',
      })
      .expect(200);

    expect(resolved.body).toMatchObject({
      id: report.id,
      status: UserReportStatus.RESOLVED,
      resolutionOutcome: UserReportResolutionOutcome.USER_SUSPENDED,
      resolutionNote: 'Confirmed after review',
    });

    const mentorAfter = await prisma.user.findUniqueOrThrow({
      where: { id: mentor.id },
    });
    expect(mentorAfter.status).toBe(UserStatus.SUSPENDED);

    await request(app.getHttpServer())
      .post(`/admin/reports/${report.id}/resolve`)
      .set(auth(adminToken))
      .send({ outcome: UserReportResolutionOutcome.NO_ACTION })
      .expect(409);
  });

  it('blocks ADMIN self-assignment via /users/me/roles', async () => {
    await ensureUsers();
    await request(app.getHttpServer())
      .post('/users/me/roles')
      .set(auth(apprenticeToken))
      .send({ roles: [Role.ADMIN] })
      .expect(400);
  });
});

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
