import {
  AvailabilityRuleStatus,
  BookingStatus,
  DayOfWeek,
  ExpertiseStatus,
  Prisma,
  PrismaClient,
  PublicationStatus,
  Role,
  SessionFeedbackRole,
  SessionStatus,
  TeachingLevel,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAIL_PREFIX = 'demo-';
const DEMO_EMAIL_DOMAIN = '@example.com';
const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

type DemoReview = [rating: number, comment: string | null];

type DemoMentor = {
  key: string;
  displayName: string;
  headline: string;
  biography: string;
  generalLocation: string;
  timezone: string;
  photo: number;
  hourlyRate: number;
  languages: string[];
  expertise: Array<{
    skillSlug: string;
    yearsExperience: number;
    teachingLevel: TeachingLevel;
    description: string;
  }>;
  reviews: DemoReview[];
};

const apprentices = [
  { key: 'liam', displayName: 'Liam Brown', location: 'Helsinki' },
  { key: 'olivia', displayName: 'Olivia Wilson', location: 'Espoo' },
  { key: 'noah', displayName: 'Noah Taylor', location: 'Tampere' },
  { key: 'mia', displayName: 'Mia Johnson', location: 'Turku' },
  { key: 'lucas', displayName: 'Lucas Moore', location: 'Vantaa' },
  { key: 'aino', displayName: 'Aino Korhonen', location: 'Oulu' },
];

const mentors: DemoMentor[] = [
  {
    key: 'marcus',
    displayName: 'Marcus Lindqvist',
    headline: 'Master mechanic · keep your car running without the garage bill',
    biography:
      'I have run an independent workshop in Helsinki for over twenty years. I teach beginners how to check fluids, change oil and brake pads, and diagnose the most common warning lights, so you can talk to a garage with confidence or skip it entirely.',
    generalLocation: 'Helsinki',
    timezone: 'Europe/Helsinki',
    photo: 12,
    hourlyRate: 45,
    languages: ['en', 'fi'],
    expertise: [
      {
        skillSlug: 'basic-car-maintenance',
        yearsExperience: 22,
        teachingLevel: TeachingLevel.BEGINNER,
        description: 'Fluids, tyres, brakes and seasonal checks.',
      },
      {
        skillSlug: 'engine-maintenance',
        yearsExperience: 18,
        teachingLevel: TeachingLevel.INTERMEDIATE,
        description: 'Timing belts, spark plugs and diagnostics.',
      },
    ],
    reviews: [
      [
        5,
        'Marcus explained every step before we did it. I changed my own brake pads the next weekend!',
      ],
      [5, 'Super patient and practical. Saved me a trip to the garage.'],
      [5, 'Best money I have spent on my car this year.'],
      [4, 'Very knowledgeable. Session ran a bit over but worth it.'],
      [5, 'Finally understand what all the dashboard lights mean.'],
      [5, null],
      [4, 'Great tips on winter tyres and battery care.'],
      [5, 'Clear, calm and funny. Booking again for engine basics.'],
      [5, 'He sent a checklist afterwards which was really helpful.'],
      [4, null],
      [5, 'Walked me through an oil change over video — worked perfectly.'],
      [5, 'Highly recommend for total beginners.'],
    ],
  },
  {
    key: 'emily',
    displayName: 'Emily Carter',
    headline: 'Conversational English coach for work and everyday life',
    biography:
      'Former secondary-school teacher from London, now coaching adults who want to speak English more naturally at work. Sessions are relaxed, focused on real conversations, and you get a short list of phrases to practise after each one.',
    generalLocation: 'London',
    timezone: 'Europe/London',
    photo: 47,
    hourlyRate: 30,
    languages: ['en', 'fr'],
    expertise: [
      {
        skillSlug: 'english-conversation',
        yearsExperience: 11,
        teachingLevel: TeachingLevel.INTERMEDIATE,
        description: 'Meetings, presentations and small talk.',
      },
    ],
    reviews: [
      [5, 'I feel so much more confident in meetings now.'],
      [5, 'Emily is warm and encouraging. Loved the practice phrases.'],
      [4, 'Good structure, would like a bit more grammar next time.'],
      [5, 'Perfect for job interview prep.'],
      [5, null],
      [5, 'She corrected me gently without breaking the flow.'],
      [4, 'Very helpful session on email writing too.'],
      [5, 'Fun and practical — I actually look forward to sessions.'],
    ],
  },
  {
    key: 'juha',
    displayName: 'Juha Virtanen',
    headline: 'Licensed plumber · fix leaks and small jobs yourself',
    biography:
      'Plumber for 15 years in Tampere. I help homeowners and renters handle dripping taps, blocked drains, running toilets and basic fittings safely, and I will tell you honestly when a job needs a professional.',
    generalLocation: 'Tampere',
    timezone: 'Europe/Helsinki',
    photo: 33,
    hourlyRate: 40,
    languages: ['fi', 'en'],
    expertise: [
      {
        skillSlug: 'plumbing-basics',
        yearsExperience: 15,
        teachingLevel: TeachingLevel.BEGINNER,
        description: 'Taps, drains, toilets and shut-off valves.',
      },
    ],
    reviews: [
      [5, 'Fixed my dripping tap during the call. Amazing.'],
      [4, 'Knows his stuff. Camera angle made it tricky but we managed.'],
      [5, 'Honest advice about what I should not attempt myself.'],
      [3, 'Useful, but I needed more time for my specific setup.'],
      [5, null],
    ],
  },
  {
    key: 'aisha',
    displayName: 'Aisha Khan',
    headline: 'Senior React developer · from first code to first job',
    biography:
      'Frontend engineer in Berlin building React apps for eight years. I mentor career changers and juniors: fundamentals, code reviews, portfolio projects and interview practice. I focus on building real things rather than tutorials.',
    generalLocation: 'Berlin',
    timezone: 'Europe/Berlin',
    photo: 45,
    hourlyRate: 60,
    languages: ['en', 'de'],
    expertise: [
      {
        skillSlug: 'programming',
        yearsExperience: 8,
        teachingLevel: TeachingLevel.INTERMEDIATE,
        description: 'JavaScript, TypeScript, React and testing.',
      },
      {
        skillSlug: 'computer-basics',
        yearsExperience: 10,
        teachingLevel: TeachingLevel.BEGINNER,
        description: 'Getting comfortable with your computer and the terminal.',
      },
    ],
    reviews: [
      [5, 'Aisha reviewed my portfolio and it landed me two interviews.'],
      [5, 'Explains hooks better than any course I have taken.'],
      [5, 'Incredibly sharp and kind. Worth every euro.'],
      [4, 'Great code review, a lot to take in though.'],
      [5, 'Mock interview was spot on.'],
      [5, null],
      [5, 'Helped me debug a nasty state issue in minutes.'],
      [4, 'Very good. Would love longer sessions.'],
      [5, 'My go-to mentor for anything frontend.'],
      [5, 'Clear roadmap for learning TypeScript.'],
    ],
  },
  {
    key: 'anna',
    displayName: 'Anna Schmidt',
    headline: 'German conversation practice for beginners and expats',
    biography:
      'Native speaker from Munich who has helped hundreds of expats get through their first months in Germany. We practise everyday situations — the doctor, the bakery, the landlord — at a pace that suits you.',
    generalLocation: 'Munich',
    timezone: 'Europe/Berlin',
    photo: 44,
    hourlyRate: 35,
    languages: ['de', 'en'],
    expertise: [
      {
        skillSlug: 'german-conversation',
        yearsExperience: 9,
        teachingLevel: TeachingLevel.BEGINNER,
        description: 'Everyday situations and pronunciation.',
      },
    ],
    reviews: [
      [5, 'Anna made me feel comfortable speaking from minute one.'],
      [4, 'Good practice. Homework was useful.'],
      [5, 'I survived my first Amt appointment thanks to her!'],
      [4, null],
      [5, 'Patient and funny. Highly recommended.'],
      [3, 'Nice session, pace was a little fast for me.'],
    ],
  },
  {
    key: 'daniel',
    displayName: 'Daniel Okafor',
    headline: 'Two-time founder · validate and launch your small business',
    biography:
      'I have started two companies, sold one, and now mentor first-time founders. We work on finding customers, pricing, simple financial planning and getting your first sales without burning savings.',
    generalLocation: 'Dublin',
    timezone: 'Europe/Dublin',
    photo: 59,
    hourlyRate: 55,
    languages: ['en'],
    expertise: [
      {
        skillSlug: 'entrepreneurship',
        yearsExperience: 14,
        teachingLevel: TeachingLevel.INTERMEDIATE,
        description: 'Validation, pricing and first customers.',
      },
    ],
    reviews: [
      [5, 'Daniel helped me rethink my pricing — sales doubled.'],
      [5, 'Straight talking and very practical.'],
      [4, 'Great frameworks, I need to apply them now.'],
      [5, null],
      [5, 'Best business advice I have received.'],
      [4, 'Very useful, a bit fast-paced.'],
      [5, 'Challenged my assumptions in a good way.'],
    ],
  },
  {
    key: 'ella',
    displayName: 'Ella Nieminen',
    headline: 'Carpenter · build, repair and restore wooden furniture',
    biography:
      'Cabinet maker from Turku. I teach hand-tool basics, safe power-tool use and small projects like shelves, stools and furniture restoration. Great if you have a garage or balcony and want to start making things.',
    generalLocation: 'Turku',
    timezone: 'Europe/Helsinki',
    photo: 32,
    hourlyRate: 38,
    languages: ['fi', 'en'],
    expertise: [
      {
        skillSlug: 'carpentry',
        yearsExperience: 12,
        teachingLevel: TeachingLevel.BEGINNER,
        description: 'Hand tools, joinery and restoration.',
      },
    ],
    reviews: [
      [5, 'Built my first shelf with Ella guiding me. So proud!'],
      [5, 'Excellent safety tips for power tools.'],
      [4, null],
    ],
  },
  {
    key: 'priya',
    displayName: 'Priya Nair',
    headline:
      'Chartered accountant · bookkeeping and Excel for small businesses',
    biography:
      'Accountant in Espoo helping freelancers and small shop owners keep simple, tidy books. We cover invoicing, expenses, VAT basics and building Excel sheets you will actually use.',
    generalLocation: 'Espoo',
    timezone: 'Europe/Helsinki',
    photo: 49,
    hourlyRate: 42,
    languages: ['en', 'fi'],
    expertise: [
      {
        skillSlug: 'accounting',
        yearsExperience: 10,
        teachingLevel: TeachingLevel.BEGINNER,
        description: 'Bookkeeping, VAT basics and Excel.',
      },
    ],
    reviews: [],
  },
];

function demoEmail(kind: 'mentor' | 'apprentice', key: string): string {
  return `${DEMO_EMAIL_PREFIX}${kind}-${key}${DEMO_EMAIL_DOMAIN}`;
}

async function removeExistingDemoData(): Promise<void> {
  const users = await prisma.user.findMany({
    where: {
      email: { startsWith: DEMO_EMAIL_PREFIX, endsWith: DEMO_EMAIL_DOMAIN },
    },
    select: {
      id: true,
      mentorProfile: { select: { id: true } },
      apprenticeProfile: { select: { id: true } },
    },
  });
  if (users.length === 0) return;

  const mentorProfileIds = users.flatMap((u) =>
    u.mentorProfile ? [u.mentorProfile.id] : [],
  );
  const apprenticeProfileIds = users.flatMap((u) =>
    u.apprenticeProfile ? [u.apprenticeProfile.id] : [],
  );
  const bookingWhere: Prisma.BookingWhereInput = {
    OR: [
      { mentorProfileId: { in: mentorProfileIds } },
      { apprenticeProfileId: { in: apprenticeProfileIds } },
    ],
  };

  await prisma.session.deleteMany({ where: { booking: bookingWhere } });
  await prisma.booking.deleteMany({ where: bookingWhere });
  await prisma.mentorshipRelationship.deleteMany({
    where: {
      OR: [
        { mentorProfileId: { in: mentorProfileIds } },
        { apprenticeProfileId: { in: apprenticeProfileIds } },
      ],
    },
  });
  await prisma.user.deleteMany({
    where: { id: { in: users.map((u) => u.id) } },
  });
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed demo data when NODE_ENV=production');
  }

  const skills = await prisma.skill.findMany({
    select: { id: true, slug: true },
  });
  const languages = await prisma.language.findMany({
    select: { id: true, code: true },
  });
  const skillIdBySlug = new Map(skills.map((s) => [s.slug, s.id]));
  const languageIdByCode = new Map(languages.map((l) => [l.code, l.id]));
  if (skillIdBySlug.size === 0 || languageIdByCode.size === 0) {
    throw new Error(
      'Catalogue is empty. Run `npm run prisma:seed -w api` first.',
    );
  }

  await removeExistingDemoData();

  const apprenticeRecords: Array<{ userId: string; profileId: string }> = [];
  for (const apprentice of apprentices) {
    const user = await prisma.user.create({
      data: {
        authProviderId: `demo|apprentice-${apprentice.key}`,
        email: demoEmail('apprentice', apprentice.key),
        emailVerified: true,
        displayName: apprentice.displayName,
        roles: { create: [{ role: Role.APPRENTICE }] },
        apprenticeProfile: {
          create: {
            shortBio: 'Demo apprentice',
            generalLocation: apprentice.location,
          },
        },
      },
      include: { apprenticeProfile: true },
    });
    apprenticeRecords.push({
      userId: user.id,
      profileId: user.apprenticeProfile!.id,
    });
  }

  const now = Date.now();
  let reviewTotal = 0;

  for (const mentor of mentors) {
    const expertise = mentor.expertise.map((entry) => {
      const skillId = skillIdBySlug.get(entry.skillSlug);
      if (!skillId) throw new Error(`Unknown skill slug ${entry.skillSlug}`);
      return { ...entry, skillId };
    });

    const user = await prisma.user.create({
      data: {
        authProviderId: `demo|mentor-${mentor.key}`,
        email: demoEmail('mentor', mentor.key),
        emailVerified: true,
        displayName: mentor.displayName,
        timezone: mentor.timezone,
        roles: { create: [{ role: Role.MENTOR }] },
        verifications: {
          create: {
            type: VerificationType.IDENTITY,
            status: VerificationStatus.VERIFIED,
            submittedAt: new Date(now - 60 * 86_400_000),
            verifiedAt: new Date(now - 60 * 86_400_000),
          },
        },
        mentorProfile: {
          create: {
            headline: mentor.headline,
            biography: mentor.biography,
            generalLocation: mentor.generalLocation,
            timezone: mentor.timezone,
            profilePhotoUrl: `https://i.pravatar.cc/300?img=${mentor.photo}`,
            hourlyRate: new Prisma.Decimal(mentor.hourlyRate),
            currency: 'EUR',
            publicationStatus: PublicationStatus.PUBLISHED,
            languages: {
              create: mentor.languages.map((code) => {
                const languageId = languageIdByCode.get(code);
                if (!languageId) throw new Error(`Unknown language ${code}`);
                return { languageId };
              }),
            },
            expertise: {
              create: expertise.map((entry) => ({
                skillId: entry.skillId,
                yearsExperience: entry.yearsExperience,
                teachingLevel: entry.teachingLevel,
                description: entry.description,
                status: ExpertiseStatus.ACTIVE,
              })),
            },
            availabilityRules: {
              create: WEEKDAYS.map((dayOfWeek) => ({
                dayOfWeek,
                startTime: '09:00',
                endTime: '17:00',
                timezone: mentor.timezone,
                status: AvailabilityRuleStatus.ACTIVE,
              })),
            },
          },
        },
      },
      include: { mentorProfile: true },
    });

    const mentorProfileId = user.mentorProfile!.id;
    const primarySkillId = expertise[0].skillId;

    for (const [index, [rating, comment]] of mentor.reviews.entries()) {
      const apprentice = apprenticeRecords[index % apprenticeRecords.length];
      const daysAgo = 3 + index * 9;
      const startAt = new Date(now - daysAgo * 86_400_000);
      startAt.setUTCHours(8 + (index % 6), 0, 0, 0);
      const endAt = new Date(startAt.getTime() + 60 * 60_000);
      const positive = rating >= 4;

      await prisma.booking.create({
        data: {
          mentorProfileId,
          apprenticeProfileId: apprentice.profileId,
          skillId: primarySkillId,
          startAt,
          endAt,
          timezoneSnapshot: mentor.timezone,
          status: BookingStatus.COMPLETED,
          session: {
            create: {
              status: SessionStatus.COMPLETED,
              externalRoomId: `demo-${mentor.key}-${index}`,
              joinUrl: `https://example.com/demo/${mentor.key}/${index}`,
              mentorJoinedAt: startAt,
              apprenticeJoinedAt: startAt,
              startedAt: startAt,
              endedAt: endAt,
              feedback: {
                create: {
                  authorUserId: apprentice.userId,
                  role: SessionFeedbackRole.APPRENTICE,
                  rating,
                  wasUseful: positive,
                  explanationsClear: positive,
                  progressMade: positive,
                  wouldBookAgain: positive,
                  comment,
                  createdAt: endAt,
                },
              },
            },
          },
        },
      });
      reviewTotal += 1;
    }
  }

  console.log(
    `Seeded ${mentors.length} demo mentors, ${apprentices.length} demo apprentices, ${reviewTotal} reviews.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
