import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ApprenticesService } from './application/apprentices.service';
import { ApprenticesController } from './apprentices.controller';
import { ApprenticesRepository } from './persistence/apprentices.repository';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ApprenticesController],
  providers: [ApprenticesService, ApprenticesRepository],
  exports: [ApprenticesService],
})
export class ApprenticesModule {}
