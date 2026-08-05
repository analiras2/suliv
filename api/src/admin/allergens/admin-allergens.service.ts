import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Allergen } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log.service';

@Injectable()
export class AdminAllergensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  listPending(): Promise<Allergen[]> {
    return this.prisma.allergen.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
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
}
