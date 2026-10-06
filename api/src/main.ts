import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildCorsOptions } from './config/cors';
import { createValidationPipe } from './errors/validation-exception.factory';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const corsOptions = buildCorsOptions(process.env.CORS_ORIGINS);
  if (corsOptions) {
    app.enableCors(corsOptions);
  }
  app.useGlobalPipes(createValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  Logger.error(error, 'Bootstrap');
  process.exitCode = 1;
});
