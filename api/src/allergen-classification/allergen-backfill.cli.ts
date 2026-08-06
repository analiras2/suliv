import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AllergenBackfillService } from './allergen-backfill.service';

// Run with: npm run allergens:backfill
// Boots the DI container without an HTTP server, regenerates every
// recipe's allergen projection, prints a summary, and exits non-zero if
// any recipe failed. Rerunnable: syncRecipeAllergens always replaces the
// full projection, so repeated runs converge to the same result.
async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const result = await application.get(AllergenBackfillService).runBackfill();

    console.log(
      `processed=${result.processed} failed=${result.failedRecipeIds.length}`,
    );
    if (result.failedRecipeIds.length > 0) {
      console.log(`failed recipe ids: ${result.failedRecipeIds.join(', ')}`);
      process.exitCode = 1;
    }
  } finally {
    await application.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
