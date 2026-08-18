import { Controller, Get, Query } from '@nestjs/common';
import { SkillsService } from './application/skills.service';
import { SkillCategoryResponseDto } from './dto/skill-category-response.dto';
import { SkillResponseDto } from './dto/skill-response.dto';
import {
  toSkillCategoryResponse,
  toSkillResponse,
} from './mappers/skill.mapper';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('categories')
  async listCategories(): Promise<SkillCategoryResponseDto[]> {
    const categories = await this.skillsService.listActiveCategories();
    return categories.map(toSkillCategoryResponse);
  }

  @Get()
  async list(
    @Query('categoryId') categoryId?: string,
  ): Promise<SkillResponseDto[]> {
    const skills = await this.skillsService.listActiveSkills(categoryId);
    return skills.map(toSkillResponse);
  }
}
