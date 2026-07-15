import { Injectable } from '@nestjs/common';
import { AllergenStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AllergenDto } from './dto';

@Injectable()
export class AllergensService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStatus(status: AllergenStatus): Promise<AllergenDto[]> {
    const allergens = await this.prisma.allergen.findMany({
      where: { status },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return allergens.map((allergen) => AllergenDto.fromAllergen(allergen));
  }
}
