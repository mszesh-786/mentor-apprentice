import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MentorshipsModule } from '../mentorships/mentorships.module';
import { UsersModule } from '../users/users.module';
import { BlocksService } from './application/blocks.service';
import { BlocksController } from './blocks.controller';
import { BlocksRepository } from './persistence/blocks.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    forwardRef(() => MentorshipsModule),
    forwardRef(() => BookingsModule),
  ],
  controllers: [BlocksController],
  providers: [BlocksService, BlocksRepository],
  exports: [BlocksService],
})
export class BlocksModule {}
