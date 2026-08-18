import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  LanguageStatus,
  PublicationStatus,
  Role,
  UserStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/errors/domain-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('MentorsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let englishId: string;
  let finnishId: string;

  const mentorTokenPayload = {
    sub: 'e2e-mentor-1',
    email: 'e2e-mentor@example.com',
    displayName: 'E2E Mentor',
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

    const seeded = await seedLanguages(prisma);
    englishId = seeded.englishId;
    finnishId = seeded.finnishId;
  });

  beforeEach(async () => {
    await prisma.mentorLanguage.deleteMany();
    await prisma.mentorProfile.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.mentorLanguage.deleteMany();
    await prisma.mentorProfile.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  function authHeader(payload: Record<string, unknown> = mentorTokenPayload) {
    const token = jwtService.sign(payload);
    return { Authorization: `Bearer ${token}` };
  }

  it('returns 401 without token', async () => {
    await request(app.getHttpServer()).post('/mentors/profile').expect(401);
  });

  it('returns 403 without MENTOR role', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(
        authHeader({
          sub: 'e2e-apprentice-1',
          email: 'apprentice@example.com',
          roles: [Role.APPRENTICE],
        }),
      )
      .send({ headline: 'Hello' })
      .expect(403);
  });

  it('creates, reads, and updates mentor profile', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({
        displayName: 'David Thompson',
        headline: 'Automotive mentor',
        biography: 'Decades of workshop experience',
        generalLocation: 'Helsinki',
        timezone: 'Europe/Helsinki',
        hourlyRate: 45,
        currency: 'EUR',
      })
      .expect(201);

    expect(createRes.body).toMatchObject({
      headline: 'Automotive mentor',
      publicationStatus: PublicationStatus.DRAFT,
      hourlyRate: '45.00',
      currency: 'EUR',
      languages: [],
    });
    const created = createRes.body as {
      id: string;
      userId: string;
      headline: string;
    };
    expect(created.id).toBeDefined();
    expect(created.userId).toBeDefined();

    const getRes = await request(app.getHttpServer())
      .get('/mentors/me')
      .set(authHeader())
      .expect(200);

    const fetched = getRes.body as { id: string; languages: unknown[] };
    expect(fetched.id).toBe(created.id);
    expect(fetched.languages).toEqual([]);

    const patchRes = await request(app.getHttpServer())
      .patch('/mentors/me')
      .set(authHeader())
      .send({ headline: 'Senior automotive mentor' })
      .expect(200);

    const patched = patchRes.body as { headline: string };
    expect(patched.headline).toBe('Senior automotive mentor');
  });

  it('sets and returns mentor languages', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Language mentor' })
      .expect(201);

    const setRes = await request(app.getHttpServer())
      .put('/mentors/me/languages')
      .set(authHeader())
      .send({ languageIds: [englishId, finnishId] })
      .expect(200);

    const updated = setRes.body as {
      languages: Array<{ id: string; code: string; name: string }>;
    };

    expect(updated.languages).toHaveLength(2);
    expect(updated.languages.map((language) => language.code)).toEqual([
      'en',
      'fi',
    ]);

    const getRes = await request(app.getHttpServer())
      .get('/mentors/me')
      .set(authHeader())
      .expect(200);

    const fetched = getRes.body as {
      languages: Array<{ id: string; code: string }>;
    };
    expect(fetched.languages.map((language) => language.id)).toEqual([
      englishId,
      finnishId,
    ]);
  });

  it('replaces mentor languages on subsequent update', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Language mentor' })
      .expect(201);

    await request(app.getHttpServer())
      .put('/mentors/me/languages')
      .set(authHeader())
      .send({ languageIds: [englishId, finnishId] })
      .expect(200);

    const setRes = await request(app.getHttpServer())
      .put('/mentors/me/languages')
      .set(authHeader())
      .send({ languageIds: [englishId] })
      .expect(200);

    const updated = setRes.body as {
      languages: Array<{ code: string }>;
    };
    expect(updated.languages).toHaveLength(1);
    expect(updated.languages[0]?.code).toBe('en');
  });

  it('returns 400 for invalid language ids', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Language mentor' })
      .expect(201);

    await request(app.getHttpServer())
      .put('/mentors/me/languages')
      .set(authHeader())
      .send({ languageIds: ['missing-language-id'] })
      .expect(400);
  });

  it('returns 409 when profile already exists', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'First' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Second' })
      .expect(409);
  });

  it('returns 400 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ hourlyRate: 40 })
      .expect(400);
  });

  it('returns 403 when user is suspended', async () => {
    await request(app.getHttpServer())
      .post('/mentors/profile')
      .set(authHeader())
      .send({ headline: 'Before suspend' })
      .expect(201);

    await prisma.user.update({
      where: { authProviderId: mentorTokenPayload.sub },
      data: { status: UserStatus.SUSPENDED },
    });

    await request(app.getHttpServer())
      .patch('/mentors/me')
      .set(authHeader())
      .send({ headline: 'After suspend' })
      .expect(403);
  });
});

async function seedLanguages(
  prisma: PrismaService,
): Promise<{ englishId: string; finnishId: string }> {
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
  const finnish = await prisma.language.upsert({
    where: { code: 'fi' },
    create: {
      code: 'fi',
      name: 'Finnish',
      sortOrder: 2,
      status: LanguageStatus.ACTIVE,
    },
    update: { name: 'Finnish', sortOrder: 2, status: LanguageStatus.ACTIVE },
  });
  await prisma.language.upsert({
    where: { code: 'de' },
    create: {
      code: 'de',
      name: 'German',
      sortOrder: 3,
      status: LanguageStatus.ACTIVE,
    },
    update: { name: 'German', sortOrder: 3, status: LanguageStatus.ACTIVE },
  });

  return { englishId: english.id, finnishId: finnish.id };
}
