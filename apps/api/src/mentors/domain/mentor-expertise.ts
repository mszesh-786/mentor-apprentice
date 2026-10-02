import { ExpertiseStatus, TeachingLevel } from '@prisma/client';
import { Skill } from '../../skills/domain/skill';

export type MentorExpertise = {
  id: string;
  mentorProfileId: string;
  skillId: string;
  yearsExperience: number;
  description: string | null;
  teachingLevel: TeachingLevel;
  status: ExpertiseStatus;
  skill: Skill;
};

export type CreateMentorExpertiseInput = {
  mentorProfileId: string;
  skillId: string;
  yearsExperience: number;
  description?: string;
  teachingLevel: TeachingLevel;
};

export type UpdateMentorExpertiseInput = {
  yearsExperience?: number;
  description?: string;
  teachingLevel?: TeachingLevel;
};
