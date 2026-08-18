import { SkillCategoryResponseDto } from './skill-category-response.dto';

export class SkillResponseDto {
  id!: string;
  slug!: string;
  name!: string;
  description!: string | null;
  sortOrder!: number;
  category!: SkillCategoryResponseDto;
}
