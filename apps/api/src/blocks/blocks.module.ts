import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { BlocksService } from './application/blocks.service';
import { BlocksController } from './blocks.controller';
import { BlocksRepository } from './persistence/blocks.repository';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [BlocksController],
  providers: [BlocksService, BlocksRepository],
  exports: [BlocksService],
})
export class BlocksModule {}
