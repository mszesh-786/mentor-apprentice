import { BadRequestException, Injectable } from '@nestjs/common';
import { Skill, SkillCategory } from '../domain/skill';
import { SkillsRepository } from '../persistence/skills.repository';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  async listActiveCategories(): Promise<SkillCategory[]> {
    return this.skillsRepository.findActiveCategories();
  }

  async listActiveSkills(categoryId?: string): Promise<Skill[]> {
    return this.skillsRepository.findActiveSkills(categoryId);
  }

  async assertActiveSkill(skillId: string): Promise<Skill> {
    const skill = await this.skillsRepository.findActiveById(skillId);
    if (!skill) {
      throw new BadRequestException('Skill is not available');
    }
    return skill;
  }
}
