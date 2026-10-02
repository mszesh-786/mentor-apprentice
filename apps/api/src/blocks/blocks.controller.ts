import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BlocksService } from './application/blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

export class BlockEntryResponseDto {
  blockedUserId!: string;
  blockedDisplayName!: string | null;
  createdAt!: string;
}

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get('me')
  async listMine(
    @CurrentUser() user: AuthUser,
  ): Promise<BlockEntryResponseDto[]> {
    const rows = await this.blocksService.listMine(user);
    return rows.map((row) => ({
      blockedUserId: row.blockedUserId,
      blockedDisplayName: row.blockedDisplayName,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async block(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBlockDto,
  ): Promise<{ blockedUserId: string }> {
    await this.blocksService.blockUser(user, dto.blockedUserId);
    return { blockedUserId: dto.blockedUserId };
  }

  @Delete(':blockedUserId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblock(
    @CurrentUser() user: AuthUser,
    @Param('blockedUserId') blockedUserId: string,
  ): Promise<void> {
    await this.blocksService.unblockUser(user, blockedUserId);
  }
}
