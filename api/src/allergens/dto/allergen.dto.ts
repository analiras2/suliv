import { Allergen } from '@prisma/client';

export class AllergenDto {
  id!: string;
  name!: string;

  static fromAllergen(allergen: Pick<Allergen, 'id' | 'name'>): AllergenDto {
    return { id: allergen.id, name: allergen.name };
  }
}
