import { Allergen } from '@prisma/client';

export class AdminAllergenDto {
  id!: string;
  name!: string;
  status!: Allergen['status'];
  createdAt!: Date;

  static fromAllergen(allergen: Allergen): AdminAllergenDto {
    return {
      id: allergen.id,
      name: allergen.name,
      status: allergen.status,
      createdAt: allergen.createdAt,
    };
  }
}
