/**
 * Feedback shown verbatim to the user when an auth or profile action fails without a more
 * specific error. It is interface copy, so it follows the Portuguese UI rather than the
 * English used for identifiers and thrown errors.
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
