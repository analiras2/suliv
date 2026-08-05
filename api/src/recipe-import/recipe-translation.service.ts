import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Recipes are short, but the model must echo every ingredient and step back,
// so the ceiling scales with recipe length rather than being a fixed sentence.
const MAX_TOKENS = 16000;
const TRANSLATION_MODEL = 'claude-sonnet-5';

const SYSTEM_PROMPT = [
  'You translate recipes from English into Brazilian Portuguese (pt-BR) for a',
  'cooking app. Translate cooking terms, ingredient names, and units the way a',
  'Brazilian home cook would say them, not literally. Keep numbers, quantities,',
  'temperatures, and times exactly as given — never convert or restate them.',
  'Do not add, merge, drop, or reorder ingredients or steps: return exactly as',
  'many items as you received, in the same order.',
].join(' ');

const TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    ingredientNames: { type: 'array', items: { type: 'string' } },
    stepDescriptions: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'description', 'ingredientNames', 'stepDescriptions'],
  additionalProperties: false,
} as const;

export interface TranslatableRecipe {
  title: string;
  description: string;
  ingredientNames: string[];
  stepDescriptions: string[];
}

export type TranslatedRecipe = TranslatableRecipe;

export class RecipeTranslationError extends Error {}

function isTranslatedRecipe(value: unknown): value is TranslatedRecipe {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    Array.isArray(candidate.ingredientNames) &&
    candidate.ingredientNames.every((name) => typeof name === 'string') &&
    Array.isArray(candidate.stepDescriptions) &&
    candidate.stepDescriptions.every((step) => typeof step === 'string')
  );
}

@Injectable()
export class RecipeTranslationService {
  private client?: Anthropic;

  constructor(private readonly configService: ConfigService) {}

  async translateToPortuguese(
    recipe: TranslatableRecipe,
  ): Promise<TranslatedRecipe> {
    const response = await this.getClient().messages.create({
      model: TRANSLATION_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      // The task is narrow and fully specified, so the cheapest effort level
      // is enough; structured output keeps the shape guaranteed regardless.
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: TRANSLATION_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: `Translate this recipe to pt-BR:\n${JSON.stringify(recipe)}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      throw new RecipeTranslationError(
        `Translation refused for "${recipe.title}"`,
      );
    }

    const translated = this.parseResponse(response, recipe.title);
    this.assertPreservesLength(recipe, translated);
    return translated;
  }

  private parseResponse(
    response: Anthropic.Message,
    title: string,
  ): TranslatedRecipe {
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    if (!textBlock) {
      throw new RecipeTranslationError(
        `Translation returned no text block for "${title}"`,
      );
    }

    const parsed: unknown = JSON.parse(textBlock.text);
    if (!isTranslatedRecipe(parsed)) {
      throw new RecipeTranslationError(
        `Translation returned an unexpected shape for "${title}"`,
      );
    }
    return parsed;
  }

  // The model is instructed to preserve item counts, but promotion maps the
  // translated strings back onto the original ingredients and steps by index,
  // so a mismatch would silently pair the wrong name with the wrong quantity.
  private assertPreservesLength(
    original: TranslatableRecipe,
    translated: TranslatedRecipe,
  ): void {
    if (
      translated.ingredientNames.length !== original.ingredientNames.length ||
      translated.stepDescriptions.length !== original.stepDescriptions.length
    ) {
      throw new RecipeTranslationError(
        `Translation changed item counts for "${original.title}"`,
      );
    }
  }

  // Passing undefined is deliberate: it lets the SDK resolve credentials from
  // its own chain (ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, then an
  // `ant auth login` profile on disk), so local development works without a
  // key in .env. Production sets the env var.
  private getClient(): Anthropic {
    this.client ??= new Anthropic({
      apiKey: this.configService.get<string>('anthropic.apiKey'),
    });
    return this.client;
  }
}
