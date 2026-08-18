import { Injectable } from '@nestjs/common';
import { CatalogueStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { Skill, SkillCategory } from '../domain/skill';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveCategories(): Promise<SkillCategory[]> {
    const rows = await this.prisma.skillCategory.findMany({
      where: { status: CatalogueStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toCategory(row));
  }

  async findActiveSkills(categoryId?: string): Promise<Skill[]> {
    const rows = await this.prisma.skill.findMany({
      where: {
        status: CatalogueStatus.ACTIVE,
        category: { status: CatalogueStatus.ACTIVE },
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toSkill(row));
  }

  async findActiveById(skillId: string): Promise<Skill | null> {
    const row = await this.prisma.skill.findFirst({
      where: {
        id: skillId,
        status: CatalogueStatus.ACTIVE,
        category: { status: CatalogueStatus.ACTIVE },
      },
      include: { category: true },
    });
    return row ? this.toSkill(row) : null;
  }

  private toCategory(row: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sortOrder: number;
  }): SkillCategory {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      sortOrder: row.sortOrder,
    };
  }

  private toSkill(row: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    status: CatalogueStatus;
    sortOrder: number;
    category: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      sortOrder: number;
    };
  }): Skill {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      status: row.status,
      sortOrder: row.sortOrder,
      category: this.toCategory(row.category),
    };
  }
}
