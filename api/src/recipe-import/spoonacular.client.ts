import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SpoonacularComplexSearchResponse,
  SpoonacularRecipe,
} from './spoonacular.types';

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

@Injectable()
export class SpoonacularClient {
  constructor(private readonly configService: ConfigService) {}

  async searchVeganRecipes(
    count: number,
    offset = 0,
  ): Promise<SpoonacularRecipe[]> {
    const apiKey = this.configService.getOrThrow<string>('spoonacular.apiKey');
    const url = new URL('/recipes/complexSearch', SPOONACULAR_BASE_URL);
    url.searchParams.set('diet', 'vegan');
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('addRecipeInformation', 'true');
    // addRecipeInformation alone does not include analyzedInstructions; the
    // API requires this flag set too, on top of addRecipeInformation.
    url.searchParams.set('addRecipeInstructions', 'true');
    // Nutrition costs only +0.025 points/recipe (auto-implies
    // addRecipeInformation) and is captured now, unparsed, so the future
    // nutrition feature doesn't have to re-spend free-tier quota re-fetching
    // recipes already imported.
    url.searchParams.set('addRecipeNutrition', 'true');
    url.searchParams.set('fillIngredients', 'true');
    url.searchParams.set('instructionsRequired', 'true');
    url.searchParams.set('number', String(count));
    url.searchParams.set('apiKey', apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Spoonacular request failed with status ${response.status}`,
      );
    }

    const body = (await response.json()) as SpoonacularComplexSearchResponse;
    return body.results;
  }
}
