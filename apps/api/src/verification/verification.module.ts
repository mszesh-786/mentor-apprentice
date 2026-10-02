import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VerificationService } from './application/verification.service';
import { VerificationRepository } from './persistence/verification.repository';
import { VerificationController } from './verification.controller';

@Module({
  imports: [AuthModule],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository],
  exports: [VerificationService],
})
export class VerificationModule {}
