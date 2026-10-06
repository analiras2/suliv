import type { IconName } from '@/components/atoms/icon';

export type AppStateKey =
  | 'splash_offline'
  | 'login_offline_no_session'
  | 'search_no_results'
  | 'feed_no_relevant_recipes'
  | 'favorites_empty'
  | 'my_recipes_empty'
  | 'submit_error'
  | 'recipe_not_found'
  | 'onboarding_submit_error';

export type StateCopyEntry = {
  illustrationIcon: IconName;
  title: string;
  description: string;
  primaryActionLabel: string;
};

export const STATE_COPY: Record<AppStateKey, StateCopyEntry> = {
  splash_offline: {
    illustrationIcon: 'warning',
    title: 'Sem conexão com a internet',
    description: 'Não conseguimos carregar o app. Verifique sua conexão e tente novamente.',
    primaryActionLabel: 'Tentar novamente',
  },
  login_offline_no_session: {
    illustrationIcon: 'warning',
    title: 'Você está offline',
    description: 'Sem conexão e sem sessão ativa, não é possível continuar. Conecte-se à internet para entrar.',
    primaryActionLabel: 'Tentar novamente',
  },
  search_no_results: {
    illustrationIcon: 'search',
    title: 'Nenhum resultado encontrado',
    description: 'Não encontramos receitas para essa busca. Tente outros termos ou ajuste os filtros.',
    primaryActionLabel: 'Limpar filtros',
  },
  feed_no_relevant_recipes: {
    illustrationIcon: 'filter',
    title: 'Ainda não temos receitas por aqui',
    description: 'Nosso catálogo está crescendo. Volte em breve para ver novas receitas.',
    primaryActionLabel: 'Atualizar',
  },
  favorites_empty: {
    illustrationIcon: 'heart',
    title: 'Sua lista de favoritos está vazia',
    description: 'Salve receitas que você gostar para encontrá-las facilmente aqui.',
    primaryActionLabel: 'Explorar receitas',
  },
  my_recipes_empty: {
    illustrationIcon: 'flexitarian',
    title: 'Você ainda não enviou receitas',
    description: 'Compartilhe sua primeira receita com a comunidade.',
    primaryActionLabel: 'Criar receita',
  },
  submit_error: {
    illustrationIcon: 'warning',
    title: 'Não foi possível enviar sua receita',
    description: 'Ocorreu um erro ao enviar para moderação. Tente novamente em instantes.',
    primaryActionLabel: 'Tentar novamente',
  },
  recipe_not_found: {
    illustrationIcon: 'close',
    title: 'Receita não encontrada',
    description: 'Essa receita não existe mais ou não está disponível no momento.',
    primaryActionLabel: 'Voltar para o feed',
  },
  onboarding_submit_error: {
    illustrationIcon: 'warning',
    title: 'Não foi possível salvar suas respostas',
    description: 'Ocorreu um erro ao enviar as informações do seu perfil. Tente novamente.',
    primaryActionLabel: 'Tentar novamente',
  },
};
