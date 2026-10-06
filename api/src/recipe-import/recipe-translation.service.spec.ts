import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import {
  RecipeTranslationError,
  RecipeTranslationService,
  TranslatableRecipe,
} from './recipe-translation.service';

jest.mock('@anthropic-ai/sdk');

interface TranslationRequest {
  model: string;
  max_tokens: number;
  system: string;
  output_config: { effort: string; format: { type: string } };
}

const create = jest.fn<Promise<unknown>, [TranslationRequest]>();

const MockedAnthropic = Anthropic as unknown as jest.Mock;

function recipeFixture(
  overrides: Partial<TranslatableRecipe> = {},
): TranslatableRecipe {
  return {
    title: 'Vegan Lentil Soup',
    description: 'A hearty vegan soup.',
    ingredientNames: ['lentils', 'carrot'],
    stepDescriptions: ['Chop the vegetables.', 'Simmer for 20 minutes.'],
    ...overrides,
  };
}

function messageFixture(payload: unknown, stopReason = 'end_turn') {
  return {
    stop_reason: stopReason,
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  };
}

describe('RecipeTranslationService', () => {
  const configService = {
    get: jest.fn().mockReturnValue('test-anthropic-key'),
  } as unknown as ConfigService;

  let service: RecipeTranslationService;

  beforeEach(() => {
    jest.clearAllMocks();
    MockedAnthropic.mockImplementation(() => ({ messages: { create } }));
    service = new RecipeTranslationService(configService);
  });

  it('returns the parsed pt-BR translation', async () => {
    const translation = {
      title: 'Sopa de Lentilha Vegana',
      description: 'Uma sopa vegana reconfortante.',
      ingredientNames: ['lentilhas cozidas', 'cenoura ralada'],
      canonicalIngredientNames: ['lentilha', 'cenoura'],
      stepDescriptions: ['Pique os legumes.', 'Cozinhe por 20 minutos.'],
    };
    create.mockResolvedValue(messageFixture(translation));

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).resolves.toEqual(translation);
  });

  it('requests a schema-constrained response from the configured model', async () => {
    create.mockResolvedValue(
      messageFixture({
        title: 'x',
        description: 'y',
        ingredientNames: ['a', 'b'],
        canonicalIngredientNames: ['a', 'b'],
        stepDescriptions: ['c', 'd'],
      }),
    );

    await service.translateToPortuguese(recipeFixture());

    const request = create.mock.calls[0][0];
    expect(request.model).toBe('claude-sonnet-5');
    expect(request.output_config.format.type).toBe('json_schema');
  });

  // The app has no brand partnerships, so imported recipes must not carry
  // commercial names. Only the model can generalize them, so the guarantee
  // lives in the prompt — this keeps it from being dropped unnoticed.
  it('instructs the model to strip brand names and keep type designations', async () => {
    create.mockResolvedValue(
      messageFixture({
        title: 'x',
        description: 'y',
        ingredientNames: ['a', 'b'],
        canonicalIngredientNames: ['a', 'b'],
        stepDescriptions: ['c', 'd'],
      }),
    );

    await service.translateToPortuguese(recipeFixture());

    const { system } = create.mock.calls[0][0];
    expect(system).toContain('never carry a brand');
    expect(system).toContain('not brands');
    expect(system).toContain('Sriracha is a brand');
  });

  // Allergen matching is exact against a curated catalog, so a descriptive
  // name never matches. The canonical name is what makes that work, and only
  // the prompt can produce it — this keeps it from being dropped unnoticed.
  it('instructs the model to return a bare pantry name per ingredient', async () => {
    create.mockResolvedValue(
      messageFixture({
        title: 'x',
        description: 'y',
        ingredientNames: ['a', 'b'],
        canonicalIngredientNames: ['a', 'b'],
        stepDescriptions: ['c', 'd'],
      }),
    );

    await service.translateToPortuguese(recipeFixture());

    const { system } = create.mock.calls[0][0];
    expect(system).toContain('canonicalIngredientNames');
    expect(system).toContain('no preparation');
  });

  it('throws when the canonical names do not align with the ingredients', async () => {
    create.mockResolvedValue(
      messageFixture({
        title: 'Sopa',
        description: 'Uma sopa.',
        ingredientNames: ['lentilhas', 'cenoura'],
        canonicalIngredientNames: ['lentilha'],
        stepDescriptions: ['Pique os legumes.', 'Cozinhe por 20 minutos.'],
      }),
    );

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).rejects.toThrow(RecipeTranslationError);
  });

  it('throws when the model refuses the request', async () => {
    create.mockResolvedValue(messageFixture({}, 'refusal'));

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).rejects.toThrow(RecipeTranslationError);
  });

  it('throws when the payload is missing required fields', async () => {
    create.mockResolvedValue(messageFixture({ title: 'só o título' }));

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).rejects.toThrow(RecipeTranslationError);
  });

  it('throws when the translation drops an ingredient', async () => {
    create.mockResolvedValue(
      messageFixture({
        title: 'Sopa',
        description: 'Uma sopa.',
        ingredientNames: ['lentilhas'],
        canonicalIngredientNames: ['lentilha'],
        stepDescriptions: ['Pique os legumes.', 'Cozinhe por 20 minutos.'],
      }),
    );

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).rejects.toThrow(RecipeTranslationError);
  });

  it('throws when the translation adds a step', async () => {
    create.mockResolvedValue(
      messageFixture({
        title: 'Sopa',
        description: 'Uma sopa.',
        ingredientNames: ['lentilhas', 'cenoura'],
        canonicalIngredientNames: ['lentilha', 'cenoura'],
        stepDescriptions: ['Pique.', 'Cozinhe.', 'Sirva.'],
      }),
    );

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).rejects.toThrow(RecipeTranslationError);
  });
});
