import { IsString, MinLength } from 'class-validator';
import { AllergenIngredientTerm } from '@prisma/client';

export class UpsertAllergenIngredientTermDto {
  @IsString()
  @MinLength(1)
  term!: string;
}

export class AdminAllergenIngredientTermDto {
  id!: string;
  allergenId!: string;
  term!: string;

  static fromTerm(
    term: AllergenIngredientTerm,
  ): AdminAllergenIngredientTermDto {
    return {
      id: term.id,
      allergenId: term.allergenId,
      term: term.term,
    };
  }
}
