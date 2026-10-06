import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AllergenCatalogService } from './allergen-catalog.service';

// Run with: npm run allergens:seed-catalog
// Populates only the allergen catalog (allergens + ingredient terms). Unlike
// `prisma:seed`, it creates no demo recipes, comments or boosts, so it is safe
// against a database holding real content. Upsert-only, so rerunnable.
//
// Recipes already stored keep their old projection until you run
// `npm run allergens:backfill`, which reclassifies every recipe.
async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const result = await application.get(AllergenCatalogService).syncCatalog();
    console.log(`allergens=${result.allergens} terms=${result.terms}`);
  } finally {
    await application.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
