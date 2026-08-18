import { CatalogueStatus } from '@prisma/client';

export type SkillCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: CatalogueStatus;
  sortOrder: number;
  category: SkillCategory;
};
