import { AvailabilityRule } from '../domain/availability-rule';
import { AvailabilityRuleResponseDto } from '../dto/availability-rule-response.dto';

export function toAvailabilityRuleResponse(
  rule: AvailabilityRule,
): AvailabilityRuleResponseDto {
  return {
    id: rule.id,
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    timezone: rule.timezone,
    status: rule.status,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
