import { ExpertiseStatus, TeachingLevel } from '@prisma/client';
import { SkillResponseDto } from '../../skills/dto/skill-response.dto';

export class MentorExpertiseResponseDto {
  id!: string;
  skillId!: string;
  yearsExperience!: number;
  description!: string | null;
  teachingLevel!: TeachingLevel;
  status!: ExpertiseStatus;
  skill!: SkillResponseDto;
}
