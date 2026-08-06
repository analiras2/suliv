import { Allergen, AllergenIngredientTerm } from '@prisma/client';
import { AdminAllergenIngredientTermDto } from './ingredient-term.dto';

export type AllergenWithTerms = Allergen & {
  ingredientTerms?: AllergenIngredientTerm[];
};

export class AdminAllergenDto {
  id!: string;
  name!: string;
  status!: Allergen['status'];
  createdAt!: Date;
  ingredientTerms?: AdminAllergenIngredientTermDto[];

  static fromAllergen(allergen: AllergenWithTerms): AdminAllergenDto {
    return {
      id: allergen.id,
      name: allergen.name,
      status: allergen.status,
      createdAt: allergen.createdAt,
      ingredientTerms: allergen.ingredientTerms?.map((term) =>
        AdminAllergenIngredientTermDto.fromTerm(term),
      ),
    };
  }
}
