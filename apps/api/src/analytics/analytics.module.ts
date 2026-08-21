import { Module } from '@nestjs/common';
import { AnalyticsService } from './application/analytics.service';
import { AnalyticsRepository } from './persistence/analytics.repository';

@Module({
  providers: [AnalyticsService, AnalyticsRepository],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
