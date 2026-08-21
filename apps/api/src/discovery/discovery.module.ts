import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { BlocksModule } from '../blocks/blocks.module';
import { BookingsModule } from '../bookings/bookings.module';
import { LanguagesModule } from '../languages/languages.module';
import { SkillsModule } from '../skills/skills.module';
import { DiscoveryService } from './application/discovery.service';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryRepository } from './persistence/discovery.repository';

@Module({
  imports: [
    AuthModule,
    SkillsModule,
    LanguagesModule,
    BlocksModule,
    AnalyticsModule,
    BookingsModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryRepository],
})
export class DiscoveryModule {}
