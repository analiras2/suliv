import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  DEFAULT_PROMOTION_COUNT,
  RecipeImportService,
} from './recipe-import.service';

function parsePromotionCount(argument: string | undefined): number {
  if (argument === undefined) {
    return DEFAULT_PROMOTION_COUNT;
  }

  const parsed = Number(argument);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `Invalid recipe count "${argument}" — pass a positive integer.`,
    );
  }
  return parsed;
}

// Run with: npm run import:recipes  (or `-- 25` to override the count).
// Boots the DI container without an HTTP server, runs one import, exits.
async function bootstrap(): Promise<void> {
  const promotionCount = parsePromotionCount(process.argv[2]);
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    await application.get(RecipeImportService).runImport(promotionCount);
  } finally {
    await application.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
