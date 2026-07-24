import { authService, type AuthService } from '@/module/auth/services/auth-service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

export class ReportsServiceError extends Error {
  constructor(readonly status: number) {
    super(`Report request failed with status ${status}.`);
  }
}

export function createReportsService(authentication: AuthService = authService): ReportsService {
  return {
    async create(input) {
      const session = await authentication.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          target_type: input.targetType,
          target_id: input.targetId,
          reason: input.reason,
          free_text: input.freeText,
        }),
      });

      if (!response.ok) {
        throw new ReportsServiceError(response.status);
      }
    },
  };
}

export const reportsService: ReportsService = createReportsService();
