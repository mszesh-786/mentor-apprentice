import { Skill, SkillCategory } from '../domain/skill';
import { SkillCategoryResponseDto } from '../dto/skill-category-response.dto';
import { SkillResponseDto } from '../dto/skill-response.dto';

export function toSkillCategoryResponse(
  category: SkillCategory,
): SkillCategoryResponseDto {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    sortOrder: category.sortOrder,
  };
}

export function toSkillResponse(skill: Skill): SkillResponseDto {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    sortOrder: skill.sortOrder,
    category: toSkillCategoryResponse(skill.category),
  };
}
