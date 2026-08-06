import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Allergen, Prisma } from '@prisma/client';
import { AllergenClassificationService } from '../../allergen-classification/allergen-classification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log.service';
import { AllergenWithTerms } from './dto/admin-allergen.dto';
import { AdminAllergenIngredientTermDto } from './dto/ingredient-term.dto';

const MEANINGFUL_CONTENT_PATTERN = /[\p{L}\p{N}]/u;

@Injectable()
export class AdminAllergensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly classificationService: AllergenClassificationService,
  ) {}

  listPending(): Promise<Allergen[]> {
    return this.prisma.allergen.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
  }

  listApproved(): Promise<AllergenWithTerms[]> {
    return this.prisma.allergen.findMany({
      where: { status: 'approved' },
      orderBy: { name: 'asc' },
      include: { ingredientTerms: { orderBy: { term: 'asc' } } },
    });
  }

  async approve(adminId: string, allergenId: string): Promise<void> {
    const allergen = await this.prisma.allergen.findUnique({
      where: { id: allergenId },
    });
    if (!allergen) {
      throw new NotFoundException('Allergen not found');
    }

    await this.prisma.allergen.update({
      where: { id: allergenId },
      data: { status: 'approved', reviewedByAdminId: adminId },
    });

    this.auditLogService.log({
      adminId,
      action: 'allergen-approve',
      targetId: allergenId,
    });
  }

  async reject(adminId: string, allergenId: string): Promise<void> {
    const allergen = await this.prisma.allergen.findUnique({
      where: { id: allergenId },
    });
    if (!allergen) {
      throw new NotFoundException('Allergen not found');
    }
    if (allergen.status !== 'pending') {
      throw new ConflictException('Allergen is not pending review');
    }

    await this.prisma.allergen.delete({ where: { id: allergenId } });

    this.auditLogService.log({
      adminId,
      action: 'allergen-reject',
      targetId: allergenId,
    });
  }

  async createTerm(
    adminId: string,
    allergenId: string,
    rawTerm: string,
  ): Promise<AdminAllergenIngredientTermDto> {
    const allergen = await this.getApprovedAllergenOrThrow(allergenId);
    const normalizedTerm = this.assertMeaningfulTerm(rawTerm);

    try {
      const term = await this.prisma.allergenIngredientTerm.create({
        data: { allergenId: allergen.id, term: rawTerm.trim(), normalizedTerm },
      });
      this.auditLogService.log({
        adminId,
        action: 'allergen-term-create',
        targetId: term.id,
      });
      return AdminAllergenIngredientTermDto.fromTerm(term);
    } catch (error) {
      if (this.isDuplicateTerm(error)) {
        throw new ConflictException(
          'A term with this value already exists for this allergen',
        );
      }
      throw error;
    }
  }

  async updateTerm(
    adminId: string,
    allergenId: string,
    termId: string,
    rawTerm: string,
  ): Promise<AdminAllergenIngredientTermDto> {
    await this.getApprovedAllergenOrThrow(allergenId);
    await this.getScopedTermOrThrow(allergenId, termId);
    const normalizedTerm = this.assertMeaningfulTerm(rawTerm);

    try {
      const term = await this.prisma.allergenIngredientTerm.update({
        where: { id: termId },
        data: { term: rawTerm.trim(), normalizedTerm },
      });
      this.auditLogService.log({
        adminId,
        action: 'allergen-term-update',
        targetId: term.id,
      });
      return AdminAllergenIngredientTermDto.fromTerm(term);
    } catch (error) {
      if (this.isDuplicateTerm(error)) {
        throw new ConflictException(
          'A term with this value already exists for this allergen',
        );
      }
      throw error;
    }
  }

  async deleteTerm(
    adminId: string,
    allergenId: string,
    termId: string,
  ): Promise<void> {
    await this.getScopedTermOrThrow(allergenId, termId);

    await this.prisma.allergenIngredientTerm.delete({ where: { id: termId } });

    this.auditLogService.log({
      adminId,
      action: 'allergen-term-delete',
      targetId: termId,
    });
  }

  private async getApprovedAllergenOrThrow(
    allergenId: string,
  ): Promise<Allergen> {
    const allergen = await this.prisma.allergen.findUnique({
      where: { id: allergenId },
    });
    if (!allergen) {
      throw new NotFoundException('Allergen not found');
    }
    if (allergen.status !== 'approved') {
      throw new UnprocessableEntityException(
        'Allergen must be approved before managing ingredient terms',
      );
    }
    return allergen;
  }

  private async getScopedTermOrThrow(allergenId: string, termId: string) {
    const term = await this.prisma.allergenIngredientTerm.findFirst({
      where: { id: termId, allergenId },
    });
    if (!term) {
      throw new NotFoundException('Ingredient term not found');
    }
    return term;
  }

  private assertMeaningfulTerm(rawTerm: string): string {
    const normalizedTerm =
      this.classificationService.normalizeIngredientName(rawTerm);
    if (!MEANINGFUL_CONTENT_PATTERN.test(normalizedTerm)) {
      throw new BadRequestException(
        'Term must contain at least one letter or number',
      );
    }
    return normalizedTerm;
  }

  private isDuplicateTerm(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
