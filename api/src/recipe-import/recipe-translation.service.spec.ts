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
      ingredientNames: ['lentilhas', 'cenoura'],
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
        stepDescriptions: ['c', 'd'],
      }),
    );

    await service.translateToPortuguese(recipeFixture());

    const request = create.mock.calls[0][0];
    expect(request.model).toBe('claude-sonnet-5');
    expect(request.output_config.format.type).toBe('json_schema');
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
        stepDescriptions: ['Pique.', 'Cozinhe.', 'Sirva.'],
      }),
    );

    await expect(
      service.translateToPortuguese(recipeFixture()),
    ).rejects.toThrow(RecipeTranslationError);
  });
});
