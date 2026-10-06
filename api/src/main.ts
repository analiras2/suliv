import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildCorsOptions } from './config/cors';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const corsOptions = buildCorsOptions(process.env.CORS_ORIGINS);
  if (corsOptions) {
    app.enableCors(corsOptions);
  }
  app.useGlobalPipes(
    new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  Logger.error(error, 'Bootstrap');
  process.exitCode = 1;
});
