import { apiRequest } from '@/lib/api-client';

export type ReportTargetType = 'recipe' | 'comment';

export type ReportReason =
  | 'conteudo_inadequado'
  | 'spam'
  | 'informacao_incorreta_perigosa'
  | 'discurso_odio_assedio'
  | 'outro';

export interface ReportsService {
  create(input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    freeText?: string;
  }): Promise<void>;
}

export const reportsService: ReportsService = {
  async create(input) {
    await apiRequest('/reports', {
      method: 'POST',
      body: {
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason,
        free_text: input.freeText,
      },
    });
  },
};
