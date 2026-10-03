import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { assertSafeAuthMode } from './auth/auth-mode';
import { parseCorsOrigins } from './common/config/cors';
import { DomainExceptionFilter } from './common/errors/domain-exception.filter';

async function bootstrap() {
  assertSafeAuthMode();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
