import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  PublicationNotEligibleError,
  UnauthorizedError,
} from './domain-error';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response
        .status(status)
        .json(typeof body === 'string' ? { message: body } : body);
      return;
    }

    if (exception instanceof DomainError) {
      response.status(this.toStatus(exception)).json({
        statusCode: this.toStatus(exception),
        code: exception.code,
        message: exception.message,
        ...(exception instanceof PublicationNotEligibleError
          ? { requirements: exception.requirements }
          : {}),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private toStatus(error: DomainError): number {
    if (error instanceof NotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    if (error instanceof ConflictError) {
      return HttpStatus.CONFLICT;
    }
    if (error instanceof ForbiddenError) {
      return HttpStatus.FORBIDDEN;
    }
    if (error instanceof PublicationNotEligibleError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    if (error instanceof UnauthorizedError) {
      return HttpStatus.UNAUTHORIZED;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
