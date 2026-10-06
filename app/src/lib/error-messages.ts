import type { AppErrorCode } from '@suliv/error-codes';

import { ApiError } from '@/lib/api-error';
import { reportUnmappedError } from '@/lib/error-report';

export const GENERIC_ERROR_MESSAGE = 'Algo deu errado. Tente novamente.';
const GENERIC_FIELD_MESSAGE = 'Confira este campo.';
const VALIDATION_FAILED_CODE = 'VALIDATION_FAILED';
const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR';
const NON_API_ERROR_CODE = 'NON_API_ERROR';

/** pt-BR copy for every code the app can receive. Compiles only while it is complete. */
export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION_FAILED: 'Confira os dados informados e tente novamente.',
  BAD_REQUEST: 'Não foi possível processar o pedido. Tente novamente.',
  UNAUTHORIZED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para fazer isso.',
  NOT_FOUND: 'Não encontramos o que você procura.',
  CONFLICT: 'Isso mudou enquanto você usava o app. Atualize e tente de novo.',
  UNPROCESSABLE: 'Não foi possível concluir essa ação. Confira os dados e tente novamente.',
  RATE_LIMITED: 'Você fez muitas tentativas. Aguarde um pouco e tente novamente.',
  INTERNAL_ERROR: 'Tivemos um problema do nosso lado. Tente novamente em instantes.',
  USER_NOT_FOUND: 'Não encontramos esse perfil.',
  RATING_OUT_OF_RANGE: 'A nota deve ser um número de 1 a 5.',
  COMMENT_NOT_FOUND: 'Esse comentário não existe mais.',
  COMMENT_NOT_OWNED: 'Você só pode alterar os seus próprios comentários.',
  COMMENT_RATE_LIMITED: 'Você atingiu o limite diário de comentários e notas. Volte amanhã.',
  USERNAME_GENERATION_FAILED: 'Não conseguimos criar seu nome de usuário. Tente novamente.',
  USERNAME_TAKEN: 'Esse nome de usuário já está em uso. Escolha outro.',
  USERNAME_CHANGE_TOO_SOON: 'Você só pode trocar o nome de usuário a cada 30 dias.',
  USERNAME_INVALID: 'Use de 3 a 20 caracteres, com letras, números, _ ou .',
  USERNAME_PROHIBITED: 'Esse nome de usuário não é permitido. Escolha outro.',
  RECIPE_NOT_FOUND: 'Essa receita não foi encontrada.',
  RECIPE_NOT_OWNED: 'Você só pode alterar as suas próprias receitas.',
  CATEGORY_NOT_FOUND: 'Escolha uma categoria válida para a receita.',
  RECIPE_COVER_REQUIRED: 'Adicione uma foto de capa antes de enviar a receita.',
  RECIPE_TERMS_NOT_ACCEPTED: 'Aceite os termos de uso para enviar a receita.',
  RECIPE_SUBMISSION_RATE_LIMITED: 'Você atingiu o limite diário de envios. Tente novamente amanhã.',
  SYNC_PAYLOAD_INVALID: 'Não foi possível sincronizar uma alteração. Confira os dados.',
  REPORT_DUPLICATE: 'Você já denunciou este conteúdo.',
  REPORT_TARGET_NOT_FOUND: 'Esse conteúdo não existe mais.',
  REPORT_RATE_LIMITED: 'Você atingiu o limite diário de denúncias. Tente novamente amanhã.',
  NETWORK_OFFLINE: 'Você está sem conexão. Verifique sua internet e tente novamente.',
  NETWORK_UNAVAILABLE: 'Não conseguimos nos conectar. Tente novamente em instantes.',
  REQUEST_TIMEOUT: 'A conexão demorou demais. Tente novamente.',
  SERVER_UNAVAILABLE: 'O Suliv está indisponível no momento. Tente novamente em instantes.',
  UNKNOWN_ERROR: GENERIC_ERROR_MESSAGE,
  AUTH_LINK_EXPIRED: 'Esse link expirou. Peça um novo link mágico.',
  AUTH_LINK_INVALID: 'Esse link não é mais válido. Peça um novo link mágico.',
  AUTH_RATE_LIMITED: 'Você pediu muitos links. Aguarde um pouco e tente de novo.',
  AUTH_EMAIL_INVALID: 'Informe um e-mail válido.',
  AUTH_PROVIDER_FAILED: 'Não foi possível entrar com essa conta. Tente novamente.',
  AUTH_SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  IMAGE_UPLOAD_FAILED: 'Não foi possível enviar a imagem. Tente novamente.',
};

/** Field-level copy keyed by `class-validator` constraint (ADR-003). */
export const VALIDATION_MESSAGES: Partial<Record<string, string>> = {
  isNotEmpty: 'Preencha este campo.',
  isString: 'Informe um texto válido.',
  isEmail: 'Informe um e-mail válido.',
  minLength: 'Este campo está muito curto.',
  maxLength: 'Este campo está muito longo.',
  isInt: 'Informe um número inteiro.',
  min: 'O valor é menor que o permitido.',
  max: 'O valor é maior que o permitido.',
  arrayMinSize: 'Adicione ao menos um item.',
  isArray: 'Informe uma lista válida.',
  isEnum: 'Escolha uma opção válida.',
  isIn: 'Escolha uma opção válida.',
  isUuid: 'Valor inválido.',
};

/**
 * Feedback for an auth or profile action that fails without a more specific
 * error. Interface copy, so Portuguese, unlike the English used for identifiers.
 */
export const AUTH_MESSAGES = {
  invalidEmail: 'Informe um e-mail válido.',
  missingName: 'Informe seu nome.',
  sessionUnavailable: 'Sua sessão expirou. Entre novamente.',
  magicLinkFailed: 'Não foi possível enviar o link mágico.',
  signInFailed: 'Não foi possível entrar. Tente novamente.',
  finishSignInFailed: 'Não foi possível concluir o login.',
  restoreSessionFailed: 'Não foi possível restaurar sua sessão.',
  updateProfileFailed: 'Não foi possível atualizar seu perfil.',
  deleteAccountFailed: 'Não foi possível excluir sua conta.',
  signOutFailed: 'Não foi possível sair da conta.',
} as const;

/**
 * Resolves what the user reads for a failure. It never returns `Error.message`:
 * an unrecognised code, or anything that is not an `ApiError`, yields the given
 * fallback or the generic copy and is reported once as `error_unmapped`.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (!(error instanceof ApiError)) {
    reportUnmappedError({ code: NON_API_ERROR_CODE, status: null, source: 'api' });
    return fallback ?? GENERIC_ERROR_MESSAGE;
  }
  if (error.code !== UNKNOWN_ERROR_CODE) {
    return ERROR_MESSAGES[error.code];
  }
  reportUnmappedError({
    code: error.rawCode ?? UNKNOWN_ERROR_CODE,
    status: error.status,
    source: error.status === null ? 'auth' : 'api',
  });
  return fallback ?? GENERIC_ERROR_MESSAGE;
}

/** Maps `VALIDATION_FAILED` details to one pt-BR message per field; other errors yield no field errors. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== VALIDATION_FAILED_CODE) {
    return {};
  }
  const fieldErrors: Record<string, string> = {};
  for (const { field, constraint } of error.details) {
    const message = VALIDATION_MESSAGES[constraint];
    if (!message) {
      reportUnmappedError({ code: constraint, status: error.status, source: 'validation' });
    }
    fieldErrors[field] ??= message ?? GENERIC_FIELD_MESSAGE;
  }
  return fieldErrors;
}
