import { BadRequestException } from '@nestjs/common';
import { CatalogueStatus } from '@prisma/client';
import { SkillsService } from './skills.service';
import { SkillsRepository } from '../persistence/skills.repository';
import { Skill, SkillCategory } from '../domain/skill';

describe('SkillsService', () => {
  const category: SkillCategory = {
    id: 'cat-1',
    slug: 'automotive',
    name: 'Automotive',
    description: null,
    sortOrder: 1,
  };

  const skill: Skill = {
    id: 'skill-1',
    slug: 'basic-car-maintenance',
    name: 'Basic Car Maintenance',
    description: null,
    status: CatalogueStatus.ACTIVE,
    sortOrder: 1,
    category,
  };

  let skillsRepository: jest.Mocked<
    Pick<
      SkillsRepository,
      'findActiveCategories' | 'findActiveSkills' | 'findActiveById'
    >
  >;
  let service: SkillsService;

  beforeEach(() => {
    skillsRepository = {
      findActiveCategories: jest.fn(),
      findActiveSkills: jest.fn(),
      findActiveById: jest.fn(),
    };
    service = new SkillsService(
      skillsRepository as unknown as SkillsRepository,
    );
  });

  it('lists active categories', async () => {
    skillsRepository.findActiveCategories.mockResolvedValue([category]);

    await expect(service.listActiveCategories()).resolves.toEqual([category]);
  });

  it('lists active skills with optional category filter', async () => {
    skillsRepository.findActiveSkills.mockResolvedValue([skill]);

    await expect(service.listActiveSkills('cat-1')).resolves.toEqual([skill]);
    expect(skillsRepository.findActiveSkills).toHaveBeenCalledWith('cat-1');
  });

  it('asserts an active skill', async () => {
    skillsRepository.findActiveById.mockResolvedValue(skill);

    await expect(service.assertActiveSkill('skill-1')).resolves.toEqual(skill);
  });

  it('rejects inactive or missing skills', async () => {
    skillsRepository.findActiveById.mockResolvedValue(null);

    await expect(service.assertActiveSkill('missing')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
