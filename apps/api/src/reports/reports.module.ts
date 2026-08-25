import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ReportsService } from './application/reports.service';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './persistence/reports.repository';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
