import type { AdminErrorCode } from '@suliv/error-codes';

import { ApiError } from './api-error';

export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente novamente.';
const GENERIC_FIELD_MESSAGE = 'Confira este campo.';
const VALIDATION_FAILED_CODE = 'VALIDATION_FAILED';
const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';
const NON_API_ERROR_CODE = 'NON_API_ERROR';

type ReportSource = 'api' | 'validation';

/** pt-BR copy for every code the panel can receive. Compiles only while it is complete. */
export const ERROR_MESSAGES: Record<AdminErrorCode, string> = {
  VALIDATION_FAILED: 'Revise os campos destacados e tente novamente.',
  BAD_REQUEST: 'A solicitação não pôde ser processada. Tente novamente.',
  UNAUTHORIZED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'O item não foi encontrado.',
  CONFLICT: 'O item foi alterado por outra pessoa. Atualize a página e tente novamente.',
  UNPROCESSABLE: 'A ação não pôde ser concluída no estado atual do item.',
  RATE_LIMITED: 'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
  INTERNAL_ERROR: 'Erro interno do servidor. Tente novamente em instantes.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  RECIPE_NOT_FOUND: 'Receita não encontrada. Ela pode ter sido removida.',
  ADMIN_INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  REPORT_NOT_FOUND: 'Denúncia não encontrada.',
  REPORT_ACTION_NOT_APPLICABLE: 'Esta ação não se aplica ao tipo de conteúdo denunciado.',
  FEATURE_FLAG_NOT_FOUND: 'Feature flag não encontrada.',
  ALLERGEN_NOT_FOUND: 'Alérgeno não encontrado.',
  ALLERGEN_NOT_PENDING: 'Este alérgeno já foi analisado.',
  ALLERGEN_NOT_APPROVED: 'Aprove o alérgeno antes de gerenciar seus termos.',
  ALLERGEN_TERM_DUPLICATE: 'Este termo já existe para este alérgeno.',
  ALLERGEN_TERM_NOT_FOUND: 'Termo não encontrado para este alérgeno.',
  ALLERGEN_TERM_INVALID: 'O termo precisa ter ao menos uma letra ou número.',
  BOOST_INVALID_PERIOD: 'A data de término deve ser posterior à data de início.',
  NETWORK_OFFLINE: 'Sem conexão com a internet. Verifique sua rede.',
  NETWORK_UNAVAILABLE: 'Não foi possível conectar ao servidor. Tente novamente.',
  REQUEST_TIMEOUT: 'O servidor demorou para responder. Tente novamente.',
  SERVER_UNAVAILABLE: 'O servidor está indisponível no momento. Tente novamente em instantes.',
  UNKNOWN_ERROR: GENERIC_ERROR_MESSAGE,
};

/** Field-level copy keyed by `class-validator` constraint (ADR-003). */
export const VALIDATION_MESSAGES: Partial<Record<string, string>> = {
  isNotEmpty: 'Preencha este campo.',
  isString: 'Informe um texto válido.',
  isEmail: 'Informe um e-mail válido.',
  minLength: 'Preencha este campo.',
  maxLength: 'Este campo está muito longo.',
  isInt: 'Informe um número inteiro.',
  min: 'O valor é menor que o permitido.',
  max: 'O valor é maior que o permitido.',
  isEnum: 'Escolha uma opção válida.',
  isUuid: 'Valor inválido.',
};

const reportedKeys = new Set<string>();

/**
 * Tells the team a code or constraint has no copy (ADR-007). The panel has no
 * analytics client, so it logs the same payload the app would send, once per
 * `code + source`. Nothing but code, status and source is included.
 */
function reportUnmapped(code: string, status: number | null, source: ReportSource): void {
  const key = `${source}:${code}`;
  if (reportedKeys.has(key)) return;
  reportedKeys.add(key);
  console.warn('error_unmapped', { code, status, source });
}

/** Test seam: forgets what was reported so each test starts a fresh session. */
export function resetUnmappedErrorReports(): void {
  reportedKeys.clear();
}

/** Resolves what the moderator reads for a failure. It never returns `Error.message`. */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (!(error instanceof ApiError)) {
    reportUnmapped(NON_API_ERROR_CODE, null, 'api');
    return fallback ?? GENERIC_ERROR_MESSAGE;
  }
  if (error.code !== UNKNOWN_ERROR_CODE) {
    return ERROR_MESSAGES[error.code];
  }
  reportUnmapped(error.rawCode ?? UNKNOWN_ERROR_CODE, error.status, 'api');
  return fallback ?? GENERIC_ERROR_MESSAGE;
}

/** Maps `VALIDATION_FAILED` details to one message per field; other errors yield none. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== VALIDATION_FAILED_CODE) {
    return {};
  }
  const fieldErrors: Record<string, string> = {};
  for (const { field, constraint } of error.details) {
    const message = VALIDATION_MESSAGES[constraint];
    if (!message) {
      reportUnmapped(constraint, error.status, 'validation');
    }
    fieldErrors[field] ??= message ?? GENERIC_FIELD_MESSAGE;
  }
  return fieldErrors;
}
