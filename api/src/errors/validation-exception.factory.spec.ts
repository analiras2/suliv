import { ArgumentMetadata } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, ValidateNested } from 'class-validator';
import { LoginDto } from '../admin-auth/dto';
import { ApiException } from './api-exception';
import { createValidationPipe } from './validation-exception.factory';

class NestedIngredientDto {
  @IsNotEmpty()
  name!: string;
}

class NestedRecipeDto {
  @ValidateNested({ each: true })
  @Type(() => NestedIngredientDto)
  ingredients!: NestedIngredientDto[];
}

class SecretDto {
  @IsString()
  @Matches(/^[a-z]+$/)
  token!: string;
}

function bodyMetadata(
  metatype: ArgumentMetadata['metatype'],
): ArgumentMetadata {
  return { type: 'body', metatype };
}

async function captureValidationFailure(
  value: unknown,
  metatype: ArgumentMetadata['metatype'],
): Promise<ApiException> {
  try {
    await createValidationPipe().transform(value, bodyMetadata(metatype));
  } catch (caught) {
    return caught as ApiException;
  }
  throw new Error('Expected the validation pipe to reject');
}

describe('createValidationPipe', () => {
  it('UT-015 reports VALIDATION_FAILED with the failing field and constraint', async () => {
    const failure = await captureValidationFailure({ email: 'x' }, LoginDto);

    expect(failure).toBeInstanceOf(ApiException);
    expect(failure.code).toBe('VALIDATION_FAILED');
    expect(failure.details).toContainEqual({
      field: 'email',
      constraint: 'isEmail',
    });
  });

  it('UT-016 reports a forbidden extra property as whitelistValidation', async () => {
    const failure = await captureValidationFailure(
      { email: 'a@b.co', password: 'x', extra: 1 },
      LoginDto,
    );

    expect(failure.details).toContainEqual({
      field: 'extra',
      constraint: 'whitelistValidation',
    });
  });

  it('UT-017 uses dotted paths for nested and array properties', async () => {
    const failure = await captureValidationFailure(
      { ingredients: [{ name: '' }] },
      NestedRecipeDto,
    );

    expect(failure.details).toContainEqual({
      field: 'ingredients.0.name',
      constraint: 'isNotEmpty',
    });
  });

  it('UT-018 never echoes the rejected value or constraint parameters', async () => {
    const rejectedValue = 'SECRET-VALUE-123';

    const failure = await captureValidationFailure(
      { token: rejectedValue },
      SecretDto,
    );

    const serialized = JSON.stringify(failure.getResponse());
    expect(serialized).not.toContain(rejectedValue);
    expect(serialized).not.toContain('a-z');
    for (const issue of failure.details ?? []) {
      expect(Object.keys(issue).sort()).toEqual(['constraint', 'field']);
    }
  });
});
