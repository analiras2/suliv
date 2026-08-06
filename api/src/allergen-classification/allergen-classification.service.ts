import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ClassificationClient = Prisma.TransactionClient | PrismaService;

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const PUNCTUATION_PATTERN = /[\p{P}\p{S}]/gu;
const WHITESPACE_PATTERN = /\s+/g;

@Injectable()
export class AllergenClassificationService {
  normalizeIngredientName(value: string): string {
    return value
      .normalize('NFD')
      .replace(DIACRITICS_PATTERN, '')
      .replace(PUNCTUATION_PATTERN, ' ')
      .trim()
      .toLowerCase()
      .replace(WHITESPACE_PATTERN, ' ');
  }

  async detectAllergenIds(
    client: ClassificationClient,
    ingredientNames: string[],
  ): Promise<string[]> {
    const normalizedNames = [
      ...new Set(
        ingredientNames
          .map((name) => this.normalizeIngredientName(name))
          .filter((name) => name.length > 0),
      ),
    ];

    if (normalizedNames.length === 0) {
      return [];
    }

    const matches = await client.allergenIngredientTerm.findMany({
      where: {
        normalizedTerm: { in: normalizedNames },
        allergen: { status: 'approved' },
      },
      select: { allergenId: true },
    });

    return [...new Set(matches.map((match) => match.allergenId))];
  }

  async syncRecipeAllergens(
    tx: Prisma.TransactionClient,
    recipeId: string,
    ingredientNames: string[],
  ): Promise<void> {
    const allergenIds = await this.detectAllergenIds(tx, ingredientNames);

    await tx.recipeAllergen.deleteMany({ where: { recipeId } });

    if (allergenIds.length === 0) {
      return;
    }

    await tx.recipeAllergen.createMany({
      data: allergenIds.map((allergenId) => ({ recipeId, allergenId })),
      skipDuplicates: true,
    });
  }
}
