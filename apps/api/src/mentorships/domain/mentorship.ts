import { MentorshipGoalStatus, MentorshipStatus } from '@prisma/client';

export type MentorshipGoal = {
  id: string;
  relationshipId: string;
  title: string;
  description: string | null;
  status: MentorshipGoalStatus;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

export type MentorshipRelationship = {
  id: string;
  mentorProfileId: string;
  apprenticeProfileId: string;
  primarySkillId: string;
  primarySkillName: string;
  status: MentorshipStatus;
  startedAt: Date;
  pausedAt: Date | null;
  completedAt: Date | null;
  endedAt: Date | null;
  endedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  mentorUserId: string;
  apprenticeUserId: string;
  mentorDisplayName: string | null;
  apprenticeDisplayName: string | null;
  goals: MentorshipGoal[];
};
