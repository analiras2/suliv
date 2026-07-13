# Suliv — Catálogo de Features do MVP

> Derivado de [02-prd.md](./02-prd.md). Cada feature agrupa um conjunto coeso de telas/regras de negócio do PRD, servindo de base para quebra em tasks. Não inclui nada listado como "fora do escopo" (PRD seção 21).

**Total: 18 features** (17 de produto + 1 de infraestrutura transversal).

---

## 1. Autenticação e Gestão de Conta

Login via Magic Link, Google e Apple, sem tela de cadastro separada — o primeiro acesso já cria a conta (PRD 4.2, 5.1). Cobre: dados obrigatórios (nome, email, username único gerado automaticamente), regras de username (3-20 caracteres, cooldown de 30 dias para alterar, filtro de profanidade, sem sugestão automática se indisponível), sessão de longa duração com refresh silencioso e suporte a múltiplos dispositivos (logout é por aparelho), aceite de termos versionado (exige re-aceite se o termo mudar), exclusão de conta com anonimização LGPD (dados pessoais zerados, receitas publicadas permanecem sem vínculo de autoria) e canal de suporte manual para quem perde acesso ao email/provedor social (sem self-service no MVP).

## 2. Splash, Bootstrap e Modo Offline

Tela inicial que valida sessão, decide a rota de entrada e carrega só dados críticos (sessão, perfil básico, status de onboarding, preferências essenciais). Se há sessão ativa mas falha de rede, entra em modo offline (acesso a favoritos e leitura de perfil). Sem sessão e sem rede, login fica bloqueado até haver conexão. Em falha de inicialização, mantém a splash com mensagem de erro e botão de retry.

## 3. Onboarding Obrigatório

Fluxo de 3 etapas, sem skip, todas obrigatórias: (1) estilo alimentar (vegano/vegetariano/flexitariano, com microcopy definida); (2) alergias/restrições (7 alergênicos fechados com autocomplete + campo livre para termo novo, que entra como `pending normalization` até um moderador aprovar e torná-lo opção global); (3) nível de cozinha (iniciante/intermediário/avançado) e frequência (raramente/algumas vezes por semana/quase todo dia — usada como segmento de retenção). Toda resposta do onboarding alimenta o motor de ranking (feature 5).

## 4. Feed e Descoberta Personalizada

Tela inicial pós-onboarding com 3 blocos: carrossel "Selecionadas para você" (5 receitas, score personalizado), carrossel de categorias (com "Ver tudo"), e lista "Top 5 da semana" (com "Ver tudo"). Cada bloco tem lógica de ordenação própria (feature 5). Não funciona offline.

## 5. Motor de Ranking, Popularidade e Recomendação

Camada de backend que calcula, em tempo real por request, o score de "Selecionadas para você" a partir de pesos (compatibilidade de preferência +40, conflito de alergia −80, dificuldade compatível +20, tempo compatível +15, populares da semana +15, receita recente +10, categoria com bom desempenho +10, boost editorial +X). Inclui: fórmula de popularidade (aberturas + 2×favoritos + 3×conclusões de guided cooking, janela de 7 dias), piso de elegibilidade (10 aberturas OU 3 conclusões) com 1 vaga sempre reservada para cold start, e boost editorial aplicado via painel admin com data de início/fim obrigatória e auditoria. Pesos são hipótese inicial a calibrar pós-lançamento.

## 6. Busca, Filtros e Listagem "Ver Tudo"

Busca acessível pelo navbar (sem tela isolada), com scroll infinito, cobrindo título/categoria/ingredientes. Filtros: categoria (6 valores fechados), tempo (4 faixas), dificuldade, preferência alimentar, alergias/restrições — todos **soft** (nunca escondem receita; reordenam, penalizam score e sinalizam conflito com um selo discreto, sem texto explicativo extra na tela). "Ver tudo" reusa o mesmo motor de filtro da busca, mantendo o contexto de origem no título e a ordenação específica do bloco de onde veio.

## 7. Detalhe da Receita e Recálculo de Porções

Tela de receita com hero, selo de preferência, tempo, dificuldade, porções, ingredientes, passos, comentários/avaliações e CTA de favoritar. Recálculo de porções é linear por padrão, com ingredientes marcáveis como não-escaláveis (sal, pimenta, `pitada`, `a gosto`). Faixa de alerta de alergia/restrição fica perto dos ingredientes (não no cabeçalho), só alerta — sem sugestão de substituição no MVP. Rota pública (deep link) funciona mesmo sem conta logada.

## 8. Preparo Guiado (Guided Cooking)

O motor de valor e retenção do produto. Um único timer ativo por vez, sempre atrelado ao passo atual; avançar de passo com timer rodando exige confirmação (e interrompe o timer); scroll para ver próximos passos não conta como avanço. Retomada funciona enquanto o app estiver vivo em background (sem restauração após matar o processo). Ao concluir todos os passos, tela de finalização com CTAs de avaliar, favoritar e compartilhar — compartilhar gera um deep link público com slug estável, acessível mesmo por quem não tem conta.

## 9. Favoritos

Favoritar/desfavoritar online ou offline. Favoritos ficam disponíveis offline com o conteúdo completo da receita, permitindo rodar o guided cooking a partir deles sem conexão. Lista com empty state orientando a explorar receitas.

## 10. Perfil e Configurações

Edição de preferências (estilo alimentar, alergias, nível, frequência) — email não é editável no MVP. Avatar reutiliza a foto do login social ou mostra iniciais (sem upload manual). Configurações reúne termos, privacidade, logout e tema (claro/escuro/automático). Inclui acesso a "Minhas receitas" com lista por status (Rascunho, Em análise, Aprovada, Precisa de ajustes).

## 11. Criação e Envio de Receitas (Minhas Receitas)

Formulário de cadastro com imagem, título, descrição, tempo, porções, dificuldade (definida pela autora), ingredientes estruturados com unidades padronizadas, passos com timer opcional por etapa, informações adicionais, mensagem ao moderador e aceite de termos versionado. Rascunho não exige imagem e é salvo remotamente (editável offline); envio exige imagem e passa por checagem automática de conteúdo impróprio antes da fila de moderação humana. Rate limit de 5 envios/dia. Editar receita aprovada gera nova versão (versionamento interno/auditoria — favoritos sempre apontam para a versão mais recente). Exclusão pela autora é soft delete, com aviso de impacto se houver favoritos de terceiras.

## 12. Painel Administrativo e Moderação de Conteúdo

Aplicação web interna separada do app de usuária final, com autenticação e roles próprios (moderador/admin). Cobre: fila de aprovação/devolução de receita ("Precisa de ajustes" com 7 categorias fechadas + texto livre opcional), reabertura de receita aprovada por denúncia, normalização de termos de alergia pendentes (vira opção global ao aprovar), aplicação de boost editorial (com prazo obrigatório e log de autoria) e gestão de feature flags. Fila de denúncia (motivos fechados, compartilhados entre receita e comentário) com rate limit de 10/dia por usuária.

## 13. Comentários e Avaliações

Nota obrigatória de 1 a 5 estrelas + comentário de texto opcional por receita, uma avaliação por usuária por receita (avaliar de novo edita a existente, nunca duplica). Não entra no cálculo de score no MVP — só exibida/agregada na tela da receita. Sujeito ao mesmo mecanismo de denúncia da feature 12, com rate limit de 20/dia por usuária.

## 14. Notificações

Três notificações transacionais confirmadas: fim de timer (local, agendada no device — não depende do backend), receita aprovada e receita precisando de ajustes (push remoto via Firebase Cloud Messaging, cobrindo Android e iOS). Magic Link continua existindo como email transacional de autenticação, fora do escopo de notificação push. Notificações de engajamento (comentário recebido, nova receita popular) ficam fora do MVP.

## 15. Sincronização Offline (Favoritos e Rascunhos)

Ações offline (favoritar/desfavoritar, editar rascunho) entram em fila local e sincronizam ao reconectar, sem perda de conteúdo em caso de erro de envio. Conflito entre dispositivos (mesma ação/rascunho editado offline em mais de um aparelho) é resolvido por last-write-wins, aplicado igualmente a favoritos e rascunhos — simplificação consciente do MVP. Rascunho com imagem não tem limite de tempo local, mas exibe aviso soft após 7 dias sem sincronizar.

## 16. Estados de Erro e Empty States

Cobertura obrigatória de 8 estados: splash sem conexão, login sem conexão/sessão, busca sem resultado, feed sem receitas relevantes, favoritos vazio, minhas receitas vazio, erro de envio para moderação, receita não encontrada/inativa. Todos devem explicar a situação em linguagem simples, sugerir a próxima ação e nunca virar beco sem saída — trabalho compartilhado entre design e frontend, tocando praticamente todas as outras features.

## 17. Analytics e Instrumentação de Eventos

~30 eventos fechados cobrindo auth/onboarding, descoberta, receita/favoritos, guided cooking, minhas receitas e perfil — cada um com payload de propriedades específico já definido, mais um contexto padrão (session_id, platform, app_version) em todo evento. Usado para medir descoberta por origem de abertura, retenção pelo funil de guided cooking (a métrica-norte) e criação pelo funil de envio para moderação.

## 18. Infraestrutura Técnica e Requisitos Não-Funcionais

Workstream transversal, sem tela própria, mas necessário para o MVP funcionar de ponta a ponta: busca full-text nativa do Postgres, paginação cursor-based em toda lista com scroll infinito, armazenamento/moderação automática de imagem (Cloudinary), i18n-ready (só pt-BR no MVP), acessibilidade básica (contraste, área de toque, screen reader), 3 ambientes (dev/staging/prod) com feature flags, SLA de performance (p95 < 500ms para listagem/feed) e rate limiting consolidado (receitas, comentários, denúncias).

---

## Notas de escopo

- Painel administrativo (feature 12) é um app separado do mobile — tem stack e cronograma próprios (ver [03-tdd.md](./03-tdd.md), fase 5).
- Features 5 (Ranking) e 17 (Analytics) são majoritariamente backend, sem UI dedicada além dos efeitos visíveis em outras telas.
- Feature 18 não é "funcionalidade" no sentido de tela, mas é trabalho de desenvolvimento real e deve ter espaço reservado no plano de implementação.
