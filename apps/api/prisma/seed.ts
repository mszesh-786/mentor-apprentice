import {
  CatalogueStatus,
  LanguageStatus,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

const languages = [
  { code: 'en', name: 'English', sortOrder: 1 },
  { code: 'fi', name: 'Finnish', sortOrder: 2 },
  { code: 'de', name: 'German', sortOrder: 3 },
  { code: 'es', name: 'Spanish', sortOrder: 4 },
  { code: 'fr', name: 'French', sortOrder: 5 },
];

const catalogue: Array<{
  slug: string;
  name: string;
  sortOrder: number;
  skills: Array<{ slug: string; name: string; sortOrder: number }>;
}> = [
  {
    slug: 'automotive',
    name: 'Automotive',
    sortOrder: 1,
    skills: [
      { slug: 'basic-car-maintenance', name: 'Basic Car Maintenance', sortOrder: 1 },
      { slug: 'engine-maintenance', name: 'Engine Maintenance', sortOrder: 2 },
    ],
  },
  {
    slug: 'languages',
    name: 'Languages',
    sortOrder: 2,
    skills: [
      { slug: 'english-conversation', name: 'English Conversation', sortOrder: 1 },
      { slug: 'german-conversation', name: 'German Conversation', sortOrder: 2 },
    ],
  },
  {
    slug: 'home-and-trades',
    name: 'Home & Trades',
    sortOrder: 3,
    skills: [
      { slug: 'plumbing-basics', name: 'Plumbing Basics', sortOrder: 1 },
      { slug: 'carpentry', name: 'Carpentry', sortOrder: 2 },
    ],
  },
  {
    slug: 'technology',
    name: 'Technology',
    sortOrder: 4,
    skills: [
      { slug: 'computer-basics', name: 'Computer Basics', sortOrder: 1 },
      { slug: 'programming', name: 'Programming', sortOrder: 2 },
    ],
  },
  {
    slug: 'business',
    name: 'Business',
    sortOrder: 5,
    skills: [
      { slug: 'accounting', name: 'Accounting', sortOrder: 1 },
      { slug: 'entrepreneurship', name: 'Entrepreneurship', sortOrder: 2 },
    ],
  },
];

async function main(): Promise<void> {
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      create: {
        ...language,
        status: LanguageStatus.ACTIVE,
      },
      update: {
        name: language.name,
        sortOrder: language.sortOrder,
        status: LanguageStatus.ACTIVE,
      },
    });
  }

  for (const category of catalogue) {
    const savedCategory = await prisma.skillCategory.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
        status: CatalogueStatus.ACTIVE,
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        status: CatalogueStatus.ACTIVE,
      },
    });

    for (const skill of category.skills) {
      await prisma.skill.upsert({
        where: { slug: skill.slug },
        create: {
          slug: skill.slug,
          name: skill.name,
          sortOrder: skill.sortOrder,
          status: CatalogueStatus.ACTIVE,
          categoryId: savedCategory.id,
        },
        update: {
          name: skill.name,
          sortOrder: skill.sortOrder,
          status: CatalogueStatus.ACTIVE,
          categoryId: savedCategory.id,
        },
      });
    }
  }
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
