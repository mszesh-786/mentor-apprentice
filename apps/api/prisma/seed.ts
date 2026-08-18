import { LanguageStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const languages = [
  { code: 'en', name: 'English', sortOrder: 1 },
  { code: 'fi', name: 'Finnish', sortOrder: 2 },
  { code: 'de', name: 'German', sortOrder: 3 },
  { code: 'es', name: 'Spanish', sortOrder: 4 },
  { code: 'fr', name: 'French', sortOrder: 5 },
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
