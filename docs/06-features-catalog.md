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

## 14. Catalogo de Termos Alergenicos


## 15. Notificações

Três notificações transacionais confirmadas: fim de timer (local, agendada no device — não depende do backend), receita aprovada e receita precisando de ajustes (push remoto via Firebase Cloud Messaging, cobrindo Android e iOS). Magic Link continua existindo como email transacional de autenticação, fora do escopo de notificação push. Notificações de engajamento (comentário recebido, nova receita popular) ficam fora do MVP.

## 16. Sincronização Offline (Favoritos e Rascunhos)

Ações offline (favoritar/desfavoritar, editar rascunho) entram em fila local e sincronizam ao reconectar, sem perda de conteúdo em caso de erro de envio. Conflito entre dispositivos (mesma ação/rascunho editado offline em mais de um aparelho) é resolvido por last-write-wins, aplicado igualmente a favoritos e rascunhos — simplificação consciente do MVP. Rascunho com imagem não tem limite de tempo local, mas exibe aviso soft após 7 dias sem sincronizar.

## 17. Estados de Erro e Empty States

Cobertura obrigatória de 8 estados: splash sem conexão, login sem conexão/sessão, busca sem resultado, feed sem receitas relevantes, favoritos vazio, minhas receitas vazio, erro de envio para moderação, receita não encontrada/inativa. Todos devem explicar a situação em linguagem simples, sugerir a próxima ação e nunca virar beco sem saída — trabalho compartilhado entre design e frontend, tocando praticamente todas as outras features.

## 18. Analytics e Instrumentação de Eventos

~30 eventos fechados cobrindo auth/onboarding, descoberta, receita/favoritos, guided cooking, minhas receitas e perfil — cada um com payload de propriedades específico já definido, mais um contexto padrão (session_id, platform, app_version) em todo evento. Usado para medir descoberta por origem de abertura, retenção pelo funil de guided cooking (a métrica-norte) e criação pelo funil de envio para moderação.

## 19. Infraestrutura Técnica e Requisitos Não-Funcionais

Workstream transversal, sem tela própria, mas necessário para o MVP funcionar de ponta a ponta: busca full-text nativa do Postgres, paginação cursor-based em toda lista com scroll infinito, armazenamento/moderação automática de imagem (Cloudinary), i18n-ready (só pt-BR no MVP), acessibilidade básica (contraste, área de toque, screen reader), 3 ambientes (dev/staging/prod) com feature flags, SLA de performance (p95 < 500ms para listagem/feed) e rate limiting consolidado (receitas, comentários, denúncias).

---

## Notas de escopo

- Painel administrativo (feature 12) é um app separado do mobile — tem stack e cronograma próprios (ver [03-tdd.md](./03-tdd.md), fase 5).
- Features 5 (Ranking) e 17 (Analytics) são majoritariamente backend, sem UI dedicada além dos efeitos visíveis em outras telas.
- Feature 18 não é "funcionalidade" no sentido de tela, mas é trabalho de desenvolvimento real e deve ter espaço reservado no plano de implementação.

---

## Checklist de testes e validações pós-desenvolvimento

> Use esta seção como roteiro de QA final do MVP inteiro. A ordem importa: primeiro validar base técnica e automação, depois smoke test do loop núcleo, depois regressão funcional completa, e só então critérios de go/no-go para release.

### 1. Preparar a rodada de validação

- [ ] Confirmar ambiente alvo da rodada (`staging` espelhando `prod`), versão do app, versão da API e flags ativas.
- [ ] Confirmar que banco, storage, notificações, auth e analytics estão apontando para o ambiente correto.
- [ ] Popular o ambiente com massa de teste suficiente:
  - [ ] usuária nova sem onboarding
  - [ ] usuária com onboarding completo
  - [ ] usuária com favoritos offline
  - [ ] usuária autora com receitas em rascunho, em análise, aprovada e "precisa de ajustes"
  - [ ] conta moderador/admin
  - [ ] receitas com e sem conflito de alergia
  - [ ] receitas com timers, porções escaláveis e ingredientes não-escaláveis
- [ ] Garantir acesso a pelo menos 2 dispositivos ou simuladores para validar conflito de sync, múltiplas sessões e push.
- [ ] Garantir cenários com rede online, offline, intermitente e reconexão controlada.

### 2. Rodar a automação obrigatória antes do QA manual

- [ ] Lint do app e da API sem erros.
- [ ] Testes unitários da API passando, com foco explícito em:
  - [ ] score/ranking
  - [ ] recálculo de porções
  - [ ] validação de username
  - [ ] regras de moderação/status
- [ ] Testes de integração da API passando, com foco explícito em:
  - [ ] auth/JWT e rotas protegidas
  - [ ] feed, busca, favoritos, comentários, moderação, sync
  - [ ] rate limits
  - [ ] feature flags
- [ ] Testes E2E mobile passando para os fluxos críticos:
  - [ ] login
  - [ ] onboarding
  - [ ] favoritar offline e sincronizar
  - [ ] guided cooking completo
- [ ] Validar que falhas de automação bloqueiam o início da regressão manual.

### 3. Smoke test do loop núcleo

- [ ] Instalar app limpo e abrir pela primeira vez.
- [ ] Concluir autenticação.
- [ ] Completar onboarding obrigatório.
- [ ] Entrar no feed e abrir uma receita recomendada.
- [ ] Recalcular porções.
- [ ] Favoritar a receita.
- [ ] Iniciar guided cooking, usar timer, avançar passos e concluir a receita.
- [ ] Verificar tela de finalização e CTAs.
- [ ] Fechar e reabrir o app com sessão preservada.
- [ ] Repetir o fluxo mínimo em Android e iOS.

### 4. Checklist funcional por feature

#### 4.1 Autenticação e gestão de conta

- [ ] Login via Magic Link funciona do começo ao fim.
- [ ] Login via Google funciona do começo ao fim.
- [ ] Login via Apple funciona do começo ao fim.
- [ ] Primeiro acesso cria a conta automaticamente sem tela separada de cadastro.
- [ ] Se provedor social não devolver nome/email, o app exige complementação antes do onboarding.
- [ ] Username gerado automaticamente respeita unicidade e formato.
- [ ] Edição de username respeita cooldown de 30 dias.
- [ ] Username inválido, indisponível ou com profanidade é rejeitado com mensagem clara.
- [ ] Sessão persiste entre reaberturas do app e faz refresh silencioso.
- [ ] Logout encerra apenas o dispositivo atual.
- [ ] Múltiplos dispositivos permanecem válidos na mesma conta.
- [ ] Re-aceite de termos é exigido quando a versão muda.
- [ ] Exclusão de conta anonimiza dados pessoais e preserva receitas publicadas sem autoria identificável.
- [ ] Fluxo de suporte manual para perda de acesso está documentado e acessível.

#### 4.2 Splash, bootstrap e modo offline

- [ ] Splash valida sessão e decide corretamente entre login, onboarding e feed.
- [ ] Apenas dados críticos são carregados no bootstrap.
- [ ] Com sessão ativa e sem rede, o app entra em modo offline.
- [ ] Sem sessão e sem rede, o login fica bloqueado.
- [ ] Falha de inicialização mantém a splash com mensagem clara e botão de retry.
- [ ] Retry recupera o fluxo quando a dependência volta.

#### 4.3 Onboarding obrigatório

- [ ] O onboarding não pode ser pulado.
- [ ] Todas as etapas exigem resposta antes de avançar.
- [ ] Etapa de estilo alimentar salva corretamente uma das 3 opções.
- [ ] Etapa de alergias/restrições permite selecionar itens existentes.
- [ ] Campo livre cria termo `pending normalization` quando não existe opção equivalente.
- [ ] Etapa de nível/frequência salva corretamente e persiste no perfil.
- [ ] Respostas aparecem refletidas nas preferências editáveis depois do onboarding.

#### 4.4 Feed e descoberta personalizada

- [ ] Feed mostra os 3 blocos esperados após onboarding completo.
- [ ] "Selecionadas para você" retorna 5 receitas.
- [ ] Carrossel de categorias funciona e abre "Ver tudo".
- [ ] "Top 5 da semana" respeita a ordenação esperada.
- [ ] Feed não funciona offline e comunica isso corretamente.
- [ ] Feed vazio ou sem receitas relevantes exibe empty state útil.

#### 4.5 Motor de ranking, popularidade e recomendação

- [ ] Score considera preferência alimentar, alergias, dificuldade, tempo, popularidade, recência, categoria e boost editorial.
- [ ] Conflito de alergia penaliza fortemente o score, mas não exclui a receita do resultado.
- [ ] Receita incompatível aparece sinalizada como conflito quando aplicável.
- [ ] Piso de elegibilidade (10 aberturas ou 3 conclusões) é respeitado.
- [ ] Sempre existe 1 vaga reservada para cold start.
- [ ] Boost editorial só vale dentro do período configurado.
- [ ] Aplicação e remoção de boost ficam auditáveis.
- [ ] Ordenação muda quando preferências da usuária mudam.

#### 4.6 Busca, filtros e listagem "Ver tudo"

- [ ] Busca encontra receitas por título.
- [ ] Busca encontra receitas por categoria.
- [ ] Busca encontra receitas por ingrediente.
- [ ] Scroll infinito pagina sem duplicar ou pular itens.
- [ ] Filtro por categoria funciona.
- [ ] Filtro por tempo funciona.
- [ ] Filtro por dificuldade funciona.
- [ ] Filtro por preferência alimentar funciona.
- [ ] Filtro por alergia/restrição é soft: reordena e sinaliza, sem esconder receitas.
- [ ] "Ver tudo" preserva contexto de origem no título e na ordenação.
- [ ] Busca sem resultado mostra estado vazio claro.

#### 4.7 Detalhe da receita e recálculo de porções

- [ ] Tela exibe hero, selo de preferência, tempo, dificuldade, porções, ingredientes, passos, comentários/avaliações e favorito.
- [ ] Recálculo de porções atualiza ingredientes linearmente.
- [ ] Ingredientes marcados como não-escaláveis não são alterados.
- [ ] Faixa de alerta de alergia/restrição aparece perto dos ingredientes.
- [ ] Não existe sugestão automática de substituição no MVP.
- [ ] Deep link público da receita abre corretamente sem autenticação.
- [ ] Receita não encontrada ou inativa mostra estado de erro adequado.

#### 4.8 Preparo guiado (guided cooking)

- [ ] A usuária consegue iniciar o guided cooking a partir do detalhe.
- [ ] Existe apenas 1 timer ativo por vez.
- [ ] Timer fica associado ao passo atual.
- [ ] Avançar de passo com timer rodando exige confirmação.
- [ ] Confirmar avanço interrompe o timer anterior.
- [ ] Scroll para ver próximos passos não marca avanço indevido.
- [ ] App retoma o guided cooking ao voltar do background enquanto o processo ainda está vivo.
- [ ] Encerrar o app mata a retomada persistente, conforme escopo do MVP.
- [ ] Conclusão de todos os passos abre a tela final.
- [ ] Compartilhamento gera deep link público estável.

#### 4.9 Favoritos

- [ ] Favoritar online funciona.
- [ ] Desfavoritar online funciona.
- [ ] Favoritar offline entra na fila local.
- [ ] Desfavoritar offline entra na fila local.
- [ ] Favoritos ficam disponíveis offline com conteúdo completo da receita.
- [ ] Guided cooking funciona a partir de uma receita favoritada offline.
- [ ] Lista vazia de favoritos exibe orientação para exploração.

#### 4.10 Perfil e configurações

- [ ] Perfil mostra nome, username, avatar social ou iniciais.
- [ ] Email aparece como não editável.
- [ ] Preferências podem ser alteradas após onboarding.
- [ ] Tema claro, escuro e automático funciona.
- [ ] Links de termos e privacidade estão acessíveis.
- [ ] Logout funciona a partir de configurações.
- [ ] "Minhas receitas" lista corretamente os status Rascunho, Em análise, Aprovada e Precisa de ajustes.

#### 4.11 Criação e envio de receitas

- [ ] Formulário aceita imagem, título, descrição, tempo, porções, dificuldade, ingredientes, passos, informações adicionais, mensagem ao moderador e aceite de termos.
- [ ] Rascunho pode ser salvo sem imagem.
- [ ] Rascunho salva remotamente quando online.
- [ ] Rascunho pode ser editado offline.
- [ ] Envio para moderação exige imagem.
- [ ] Moderação automática de imagem é executada antes da fila humana.
- [ ] Rate limit de 5 envios/dia é respeitado.
- [ ] Receita aprovada editada pela autora gera nova versão, sem quebrar favoritos.
- [ ] Exclusão de receita pela autora é soft delete e exibe aviso de impacto.

#### 4.12 Painel administrativo e moderação

- [ ] Painel admin exige autenticação própria.
- [ ] Roles de moderador/admin são respeitadas.
- [ ] Fila de moderação lista receitas em análise.
- [ ] Aprovar receita publica corretamente no catálogo.
- [ ] Devolver receita com "Precisa de ajustes" exige categoria e aceita texto livre opcional.
- [ ] Receita aprovada pode ser reaberta por denúncia.
- [ ] Termos pendentes de alergia podem ser normalizados e viram opção global.
- [ ] Boost editorial exige data de início e fim.
- [ ] Gestão de feature flags funciona no painel.
- [ ] Rate limit de denúncias (10/dia) é respeitado.
- [ ] Todas as ações de moderação ficam auditadas com autoria e data.

#### 4.13 Comentários e avaliações

- [ ] É possível avaliar receita com nota de 1 a 5.
- [ ] Comentário de texto é opcional.
- [ ] Existe apenas uma avaliação por usuária por receita.
- [ ] Reavaliar edita a avaliação existente, sem duplicar.
- [ ] Comentários e médias aparecem corretamente na tela da receita.
- [ ] Denúncia de comentário usa o mesmo mecanismo da moderação.
- [ ] Rate limit de 20 comentários/avaliações por dia é respeitado.

#### 4.14 Notificações

- [ ] Notificação local de fim de timer dispara no device.
- [ ] Notificação local funciona com app em background.
- [ ] Push de receita aprovada chega no device correto.
- [ ] Push de receita precisando de ajustes chega no device correto.
- [ ] Device token é registrado corretamente.
- [ ] Ausência de permissão de notificação é tratada sem travar o fluxo principal.

#### 4.15 Sincronização offline

- [ ] Fila local registra ações offline de favoritos e rascunhos.
- [ ] Reconexão dispara sincronização automática ou assistida conforme implementado.
- [ ] API aplica ações da fila sem duplicar efeitos.
- [ ] `idempotency_key` é respeitada em favoritos e rascunhos.
- [ ] Conflito entre dispositivos é resolvido por last-write-wins.
- [ ] Rascunho com imagem criada offline sincroniza texto e depois upload da imagem ao reconectar.
- [ ] Rascunho com mais de 7 dias sem sincronizar mostra aviso soft.
- [ ] Falha de sync não perde conteúdo local.

#### 4.16 Estados de erro e empty states

- [ ] Splash sem conexão.
- [ ] Login sem conexão/sessão.
- [ ] Busca sem resultado.
- [ ] Feed sem receitas relevantes.
- [ ] Favoritos vazio.
- [ ] Minhas receitas vazio.
- [ ] Erro de envio para moderação.
- [ ] Receita não encontrada/inativa.
- [ ] Todos os estados explicam a situação e oferecem próxima ação viável.

#### 4.17 Analytics e instrumentação

- [ ] Eventos de auth são disparados com payload correto.
- [ ] Eventos de onboarding são disparados com payload correto.
- [ ] Eventos de descoberta/feed/busca são disparados com payload correto.
- [ ] Eventos de abertura de receita, favoritos e guided cooking são disparados com payload correto.
- [ ] Eventos de "Minhas receitas" e perfil são disparados com payload correto.
- [ ] Todo evento carrega `session_id`, `platform` e `app_version`.
- [ ] `guided_cook_started` e `guided_cook_finished` chegam ao backend/analytics sem perda.
- [ ] Popularidade da receita reflete os sinais esperados sem ler evento cru na query do feed.

#### 4.18 Infraestrutura técnica e requisitos não-funcionais

- [ ] Busca full-text do Postgres retorna resultados relevantes.
- [ ] Toda lista com scroll infinito usa paginação cursor-based sem inconsistência.
- [ ] Upload e transformação de imagem via Cloudinary funciona.
- [ ] Projeto está preparado para i18n, mesmo entregando só pt-BR no MVP.
- [ ] Contraste, área de toque e screen reader atendem ao mínimo de acessibilidade.
- [ ] Ambientes dev, staging e prod estão separados.
- [ ] Feature flags funcionam por ambiente.
- [ ] p95 de feed/listagens fica abaixo de 500 ms no cenário alvo do MVP.
- [ ] Rate limiting consolidado está ativo e observável.

### 5. Validações transversais obrigatórias

#### 5.1 Segurança e permissão

- [ ] Rotas protegidas rejeitam token ausente, inválido ou expirado.
- [ ] Usuária final não acessa dados de outra usuária.
- [ ] Usuária final não acessa recursos internos de moderação.
- [ ] Receita não aprovada não aparece em feed, busca ou deep link público.
- [ ] Dados sensíveis de alergia/restrição só aparecem para quem precisa acessá-los.

#### 5.2 Performance e resiliência

- [ ] Feed, busca e detalhe mantêm tempo de resposta aceitável sob carga compatível com o MVP.
- [ ] App não entra em loop de retry em falha de rede.
- [ ] Reconexão após período offline não bloqueia a UI de forma indevida.
- [ ] Falha temporária de Supabase, Cloudinary ou FCM gera erro tratável e observável.

#### 5.3 Observabilidade e auditoria

- [ ] Logs estruturados cobrem rejeições de auth, falhas de sync e ações de moderação.
- [ ] Métricas técnicas mínimas estão visíveis para API e dependências externas.
- [ ] Dashboard do funil `guided_cook_started` → `guided_cook_finished` está validado.
- [ ] Ações de boost editorial e moderação podem ser auditadas depois.

#### 5.4 Rollback e operação

- [ ] Existe plano claro para desligar feature por flag sem novo deploy.
- [ ] Existe versão anterior pronta para rollback da API/app.
- [ ] Toda migration relevante foi testada em `staging`.
- [ ] Passo de rollback está documentado para código e banco.

### 6. Critérios de saída da rodada

- [ ] Nenhum bug crítico aberto em auth, onboarding, feed, detalhe, favoritos, guided cooking, sync ou moderação.
- [ ] Nenhum bug alto aberto em perda de dados, segurança, LGPD, problemas de score, publicação indevida ou notificações essenciais.
- [ ] Todos os testes automatizados obrigatórios passaram na build candidata.
- [ ] Checklist manual concluído em Android e iOS.
- [ ] Analytics essencial validado em ambiente candidato.
- [ ] Performance mínima e rate limits validados.
- [ ] Go/no-go registrado com responsáveis de produto, engenharia e QA.

### 7. Evidências que devem ser anexadas à rodada

- [ ] Link da build validada.
- [ ] Hash/commit da API e do app.
- [ ] Resultado da automação executada.
- [ ] Registro dos devices e versões de SO usados no QA.
- [ ] Capturas ou vídeos dos fluxos críticos.
- [ ] Lista de bugs encontrados, severidade e decisão de release.
