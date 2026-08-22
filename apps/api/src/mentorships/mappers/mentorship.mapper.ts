import { MentorshipRelationship } from '../domain/mentorship';
import { MentorshipResponseDto } from '../dto/mentorship.dto';

export function toMentorshipResponse(
  relationship: MentorshipRelationship,
): MentorshipResponseDto {
  return {
    id: relationship.id,
    mentorProfileId: relationship.mentorProfileId,
    apprenticeProfileId: relationship.apprenticeProfileId,
    primarySkillId: relationship.primarySkillId,
    primarySkillName: relationship.primarySkillName,
    status: relationship.status,
    startedAt: relationship.startedAt.toISOString(),
    pausedAt: relationship.pausedAt?.toISOString() ?? null,
    completedAt: relationship.completedAt?.toISOString() ?? null,
    endedAt: relationship.endedAt?.toISOString() ?? null,
    endedByUserId: relationship.endedByUserId,
    mentorUserId: relationship.mentorUserId,
    apprenticeUserId: relationship.apprenticeUserId,
    mentorDisplayName: relationship.mentorDisplayName,
    apprenticeDisplayName: relationship.apprenticeDisplayName,
    createdAt: relationship.createdAt.toISOString(),
    updatedAt: relationship.updatedAt.toISOString(),
    goals: relationship.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      createdByUserId: goal.createdByUserId,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      completedAt: goal.completedAt?.toISOString() ?? null,
    })),
  };
}
