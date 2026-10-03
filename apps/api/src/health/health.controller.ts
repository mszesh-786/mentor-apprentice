import { Controller, Get } from '@nestjs/common';

/** Liveness probe. Deliberately skips the database so probes do not keep a serverless DB awake. */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
