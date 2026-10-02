import {
  Body,
  Controller,
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
import { FeedbackService } from './application/feedback.service';
import {
  ProductFeedbackResponseDto,
  SessionFeedbackResponseDto,
  SubmitProductFeedbackDto,
  SubmitSessionFeedbackDto,
} from './dto/feedback.dto';
import {
  toProductFeedbackResponse,
  toSessionFeedbackResponse,
} from './mappers/feedback.mapper';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get(':id/feedback/me')
  async getMine(
    @CurrentUser() user: AuthUser,
    @Param('id') sessionId: string,
  ): Promise<SessionFeedbackResponseDto> {
    const feedback = await this.feedbackService.getMySessionFeedback(
      user,
      sessionId,
    );
    return toSessionFeedbackResponse(feedback);
  }

  @Post(':id/feedback')
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @CurrentUser() user: AuthUser,
    @Param('id') sessionId: string,
    @Body() dto: SubmitSessionFeedbackDto,
  ): Promise<SessionFeedbackResponseDto> {
    const feedback = await this.feedbackService.submitSessionFeedback(
      user,
      sessionId,
      dto,
    );
    return toSessionFeedbackResponse(feedback);
  }
}

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class ProductFeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('product')
  @HttpCode(HttpStatus.CREATED)
  async submitProduct(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitProductFeedbackDto,
  ): Promise<ProductFeedbackResponseDto> {
    const feedback = await this.feedbackService.submitProductFeedback(
      user,
      dto,
    );
    return toProductFeedbackResponse(feedback);
  }
}
