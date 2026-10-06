import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Recipes are short, but the model must echo every ingredient and step back,
// so the ceiling scales with recipe length rather than being a fixed sentence.
const MAX_TOKENS = 16000;
const TRANSLATION_MODEL = 'claude-sonnet-5';

// The app has no partnership with any food brand, so upstream recipes must
// not carry commercial names into it. The model is asked to generalize them
// because no maintainable blocklist would cover the brands a third-party
// recipe catalog contains.
const BRAND_INSTRUCTION = [
  'The app has no commercial partnerships, so never carry a brand, trademark,',
  'store or manufacturer name into the output — not in the title, the',
  'description, or an ingredient. Replace it with the generic ingredient it',
  'refers to: "Trader Joe\'s spicy peanut vinaigrette" becomes "molho',
  'vinagrete picante de amendoim", and a title like "Trader Joe\'s Copycat',
  'Gnocchi" becomes "Nhoque de couve-flor". Never drop the ingredient itself',
  'just because its name was a brand — describe what it is.',
  'Sriracha is a brand: always write "molho de pimenta" instead.',
  'Designations that name a type or origin rather than a maker are not brands',
  'and must be kept: mostarda Dijon, arroz basmati, queijo parmesão,',
  'vinagre balsâmico.',
].join(' ');

// Allergen classification matches an ingredient name exactly against a curated
// catalog (ADR-001), so a descriptive name like "tofu light em bloco" never
// matches "tofu". The model therefore returns a second, pantry-style name per
// ingredient for matching, while the displayed name keeps its preparation.
const CANONICAL_NAME_INSTRUCTION = [
  'For every ingredient also return a canonical name in',
  '`canonicalIngredientNames`: the bare pantry name of the ingredient, with no',
  'quantity, no preparation, no state, no parenthetical and no qualifier.',
  '"castanha de caju deixada de molho durante a noite" becomes "castanha de',
  'caju", "tofu light em bloco" becomes "tofu", "farinha de rosca temperada"',
  'becomes "farinha de rosca", and "molho de aminoácidos líquidos (tipo shoyu)"',
  'becomes "molho de soja". Keep a compound name when the extra words are part',
  'of the ingredient rather than a description of it: "leite de coco", "farinha',
  'de amêndoas" and "molho de soja" are already canonical. Use the singular',
  'form, and return one canonical name per ingredient in the same order.',
].join(' ');

const SYSTEM_PROMPT = [
  'You translate recipes from English into Brazilian Portuguese (pt-BR) for a',
  'cooking app. Translate cooking terms, ingredient names, and units the way a',
  'Brazilian home cook would say them, not literally. Keep numbers, quantities,',
  'temperatures, and times exactly as given — never convert or restate them.',
  'Do not add, merge, drop, or reorder ingredients or steps: return exactly as',
  'many items as you received, in the same order.',
  BRAND_INSTRUCTION,
  CANONICAL_NAME_INSTRUCTION,
].join(' ');

const TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    ingredientNames: { type: 'array', items: { type: 'string' } },
    canonicalIngredientNames: { type: 'array', items: { type: 'string' } },
    stepDescriptions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'title',
    'description',
    'ingredientNames',
    'canonicalIngredientNames',
    'stepDescriptions',
  ],
  additionalProperties: false,
} as const;

export interface TranslatableRecipe {
  title: string;
  description: string;
  ingredientNames: string[];
  stepDescriptions: string[];
}

export interface TranslatedRecipe extends TranslatableRecipe {
  // One per ingredient, aligned by index with `ingredientNames`. Used for
  // allergen matching only; `ingredientNames` is what the app displays.
  canonicalIngredientNames: string[];
}

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
    Array.isArray(candidate.canonicalIngredientNames) &&
    candidate.canonicalIngredientNames.every(
      (name) => typeof name === 'string',
    ) &&
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
      translated.canonicalIngredientNames.length !==
        original.ingredientNames.length ||
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
