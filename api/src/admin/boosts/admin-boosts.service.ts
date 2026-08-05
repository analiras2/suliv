import { BadRequestException, Injectable } from '@nestjs/common';
import { EditorialBoost } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log.service';

@Injectable()
export class AdminBoostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  list(): Promise<EditorialBoost[]> {
    return this.prisma.editorialBoost.findMany({
      orderBy: { startsAt: 'desc' },
    });
  }

  async create(
    adminId: string,
    recipeId: string,
    weight: number,
    startsAt: Date,
    endsAt: Date,
  ): Promise<EditorialBoost> {
    if (endsAt <= startsAt) {
      throw new BadRequestException('ends_at must be after starts_at');
    }

    const boost = await this.prisma.editorialBoost.create({
      data: {
        recipeId,
        weight,
        startsAt,
        endsAt,
        appliedByAdminId: adminId,
      },
    });

    this.auditLogService.log({
      adminId,
      action: 'boost-create',
      targetId: boost.id,
    });

    return boost;
  }
}
