import { Injectable } from '@nestjs/common';
import { LanguageStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { Language } from '../domain/language';

type LanguageRow = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
};

@Injectable()
export class LanguagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(): Promise<Language[]> {
    const rows = await this.prisma.language.findMany({
      where: { status: LanguageStatus.ACTIVE },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row: LanguageRow) => this.toDomain(row));
  }

  async findActiveByIds(languageIds: string[]): Promise<Language[]> {
    const rows = await this.prisma.language.findMany({
      where: { id: { in: languageIds } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row: LanguageRow) => this.toDomain(row));
  }

  private toDomain(row: LanguageRow): Language {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      sortOrder: row.sortOrder,
    };
  }
}
