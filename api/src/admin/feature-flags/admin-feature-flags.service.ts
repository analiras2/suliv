import { Injectable, NotFoundException } from '@nestjs/common';
import { FeatureFlag, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log.service';

export interface UpdateFeatureFlagChanges {
  enabled?: boolean;
  rolloutPercentage?: number;
}

@Injectable()
export class AdminFeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  listAll(): Promise<FeatureFlag[]> {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async update(
    adminId: string,
    key: string,
    changes: UpdateFeatureFlagChanges,
  ): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    const data: Prisma.FeatureFlagUpdateInput = {};
    if (changes.enabled !== undefined) {
      data.enabled = changes.enabled;
    }
    if (changes.rolloutPercentage !== undefined) {
      data.rolloutPercentage = changes.rolloutPercentage;
    }

    const updated = await this.prisma.featureFlag.update({
      where: { key },
      data,
    });

    this.auditLogService.log({
      adminId,
      action: 'feature-flag-update',
      targetId: key,
    });

    return updated;
  }
}
