import { Injectable, Logger } from '@nestjs/common';
import { AllergenStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AllergenClassificationService } from './allergen-classification.service';
import {
  ALLERGEN_INGREDIENT_TERMS,
  APPROVED_ALLERGENS,
} from './allergen-catalog';

export interface CatalogSyncResult {
  allergens: number;
  terms: number;
}

@Injectable()
export class AllergenCatalogService {
  private readonly logger = new Logger(AllergenCatalogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly classification: AllergenClassificationService,
  ) {}

  /**
   * Populates allergens and their ingredient terms. Upsert-only and
   * idempotent — it never deletes, so running it against a populated database
   * converges without touching recipes, users, or operator-added terms.
   */
  async syncCatalog(): Promise<CatalogSyncResult> {
    for (const name of APPROVED_ALLERGENS) {
      await this.prisma.allergen.upsert({
        where: { name },
        // Classification only considers approved allergens, so an allergen
        // left pending from a user suggestion is promoted here.
        update: { status: AllergenStatus.approved },
        create: { name, status: AllergenStatus.approved },
      });
    }

    let termCount = 0;
    for (const [allergenName, terms] of Object.entries(
      ALLERGEN_INGREDIENT_TERMS,
    )) {
      const allergen = await this.prisma.allergen.findUniqueOrThrow({
        where: { name: allergenName },
      });

      for (const term of terms) {
        const normalizedTerm =
          this.classification.normalizeIngredientName(term);
        await this.prisma.allergenIngredientTerm.upsert({
          where: {
            allergenId_normalizedTerm: {
              allergenId: allergen.id,
              normalizedTerm,
            },
          },
          update: { term },
          create: { allergenId: allergen.id, term, normalizedTerm },
        });
        termCount += 1;
      }
    }

    this.logger.log(
      `Catalog synced: ${APPROVED_ALLERGENS.length} allergen(s), ${termCount} term(s).`,
    );

    return { allergens: APPROVED_ALLERGENS.length, terms: termCount };
  }
}
