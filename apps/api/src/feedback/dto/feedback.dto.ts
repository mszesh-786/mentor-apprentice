import { ProductFeedbackCategory, SessionFeedbackRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SubmitSessionFeedbackDto {
  @IsOptional()
  @IsBoolean()
  wasUseful?: boolean;

  @IsOptional()
  @IsBoolean()
  explanationsClear?: boolean;

  @IsOptional()
  @IsBoolean()
  progressMade?: boolean;

  @IsOptional()
  @IsBoolean()
  wouldBookAgain?: boolean;

  @IsOptional()
  @IsBoolean()
  apprenticeRespectful?: boolean;

  @IsOptional()
  @IsBoolean()
  learningGoalClear?: boolean;

  @IsOptional()
  @IsBoolean()
  wouldMentorAgain?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class SubmitProductFeedbackDto {
  @IsEnum(ProductFeedbackCategory)
  category!: ProductFeedbackCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageContext?: string;
}

export class SessionFeedbackResponseDto {
  id!: string;
  sessionId!: string;
  authorUserId!: string;
  role!: SessionFeedbackRole;
  wasUseful!: boolean | null;
  explanationsClear!: boolean | null;
  progressMade!: boolean | null;
  wouldBookAgain!: boolean | null;
  apprenticeRespectful!: boolean | null;
  learningGoalClear!: boolean | null;
  wouldMentorAgain!: boolean | null;
  rating!: number | null;
  comment!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class ProductFeedbackResponseDto {
  id!: string;
  category!: ProductFeedbackCategory;
  message!: string;
  pageContext!: string | null;
  createdAt!: string;
}
