# REVIEW

> Plano operacional de review e validação do Suliv. Este documento existe para registrar o que já foi executado, o que já foi revisado e qual é o próximo passo da rodada atual.

## Contexto da rodada

- Data de início da rodada: `2026-07-29`
- Objetivo: revisar por partes as features já executadas no Compozy, validar se foram implementadas corretamente e registrar pendências antes de seguir para novas features
- Estratégia: revisar uma feature por vez, sempre na ordem de dependência e impacto no produto

## Fluxo padrão por feature

Para cada feature, seguir sempre esta sequência:

1. Rodar validação dos artefatos da workflow

```bash
compozy tasks validate --name <slug>
```

2. Fazer review manual da implementação

- Usar `cy-review-round` para gerar uma rodada manual de issues em `.compozy/tasks/<slug>/reviews-NNN/`
- Se já existir PR com review externo, complementar depois com `compozy reviews fetch <slug> --provider coderabbit --pr <N>`

3. Corrigir issues encontradas

```bash
compozy reviews fix <slug> --ide codex
```

4. Rodar validação funcional da feature

- smoke test
- testes automatizados relacionados
- checagem contra `_techspec.md`, `_tasks.md` e `_tests.md`

5. Atualizar este documento

- marcar status
- registrar issues encontradas
- definir próximo passo

## Legenda de status

- `Executado, review pendente`
- `Em review`
- `Review concluído, com issues`
- `Em correção`
- `Validado`
- `Aguardando execução`
- `Fora da rodada atual`

## Ordem da rodada atual

### Features já executadas e que precisam passar por review

| Ordem | Feature | Slug Compozy | Status inicial |
| --- | --- | --- | --- |
| 1 | Autenticação e Gestão de Conta | `autenticacao-gestao-conta` | `Executado, review pendente` |
| 2 | Splash, Bootstrap e Modo Offline | `splash-bootstrap-modo-offline` | `Executado, review pendente` |
| 3 | Onboarding Obrigatório | `onboarding-obrigatorio` | `Executado, review pendente` |
| 4 | Feed e Descoberta Personalizada | `feed-descoberta-personalizada` | `Executado, review pendente` |
| 5 | Motor de Ranking, Popularidade e Recomendação | `motor-ranking-popularidade-recomendacao` | `Executado, review pendente` |
| 6 | Busca, Filtros e Listagem "Ver Tudo" | `busca-filtros-ver-tudo` | `Executado, review pendente` |
| 7 | Detalhe da Receita e Recálculo de Porções | `detalhe-receita-recalculo-porcoes` | `Executado, review pendente` |
| 8 | Preparo Guiado (Guided Cooking) | `preparo-guiado` | `Executado, review pendente` |
| 9 | Favoritos | `favoritos` | `Executado, review pendente` |
| 10 | Perfil e Configurações | `perfil-configuracoes` | `Executado, review pendente` |
| 11 | Criação e Envio de Receitas (Minhas Receitas) | `criacao-envio-receitas` | `Executado, review pendente` |

### Próximas features mencionadas pela usuária

| Ordem | Feature | Slug Compozy | Status inicial |
| --- | --- | --- | --- |
| 12 | Painel Administrativo e Moderação de Conteúdo | `painel-administrativo-moderacao` | `Aguardando execução` |
| 13 | Comentários e Avaliações | `comentarios-avaliacoes` | `Aguardando execução` |

### Fora da rodada atual ou sem confirmação nesta conversa

| Feature | Slug Compozy | Status inicial |
| --- | --- | --- |
| Notificações | `notificacoes` | `Fora da rodada atual` |
| Sincronização Offline | `sincronizacao-offline` | `Fora da rodada atual` |
| Analytics e Instrumentação | `analytics-instrumentacao` | `Fora da rodada atual` |
| Estados de Erro e Empty States | `estados-erro-empty-states` | `Fora da rodada atual` |
| Infraestrutura Técnica e Requisitos Não-Funcionais | `infraestrutura-tecnica-nao-funcionais` | `Fora da rodada atual` |
| Onboarding Redesign Visual | `onboarding-redesign-visual` | `Fora da rodada atual` |

## Sequência recomendada de review

Para evitar revisar coisas dependentes antes da base, a rodada deve seguir nesta ordem:

1. `autenticacao-gestao-conta`
2. `splash-bootstrap-modo-offline`
3. `onboarding-obrigatorio`
4. `motor-ranking-popularidade-recomendacao`
5. `feed-descoberta-personalizada`
6. `busca-filtros-ver-tudo`
7. `detalhe-receita-recalculo-porcoes`
8. `favoritos`
9. `preparo-guiado`
10. `perfil-configuracoes`
11. `criacao-envio-receitas`
12. `painel-administrativo-moderacao`
13. `comentarios-avaliacoes`

## Próximo passo imediato

Feature atual da rodada:

- `painel-administrativo-moderacao`

Passos imediatos:

1. Rodar `compozy tasks validate --name painel-administrativo-moderacao`
2. Abrir a rodada manual de review dessa feature
3. Registrar os issues encontrados
4. Corrigir antes de avançar para `comentarios-avaliacoes`

## Registro da rodada

### 1. `autenticacao-gestao-conta`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-29 (`all tasks valid`, 5 tasks escaneadas)
- Review round: `.compozy/tasks/autenticacao-gestao-conta/reviews-001/`
- Issues encontradas: 2 high
- Correções aplicadas: issues `issue_001.md` e `issue_002.md` marcadas como `resolved`
- QA funcional: em 2026-07-29, API passou 2 suites / 22 testes; app passou 6 suites / 41 testes, ambos com `--watchman=false`; Maestro não executado nesta etapa
- Decisão final: liberado para avançar para `splash-bootstrap-modo-offline`
- Próximo passo: revisar `splash-bootstrap-modo-offline`

### 2. `splash-bootstrap-modo-offline`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/splash-bootstrap-modo-offline/reviews-001/`
- Issues encontradas: 1 high
- Correções aplicadas: `issue_001.md` marcada como `resolved`; commit `6405632 fix(app): forward splash profile abort signal`
- QA funcional: em 2026-07-30, testes focados do app passaram com `--watchman=false` (5 suites / 30 testes); `npm run lint` passou com 0 erros e 4 warnings já existentes; Maestro não executado nesta etapa
- Decisão final: liberado para avançar para `onboarding-obrigatorio`
- Próximo passo: revisar `onboarding-obrigatorio`

### 3. `onboarding-obrigatorio`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 5 tasks escaneadas)
- Review round: `.compozy/tasks/onboarding-obrigatorio/reviews-001/`
- Issues encontradas: 1 medium
- Correções aplicadas: `issue_001.md` marcada como `resolved`; commit `96a24f0 fix(app): map onboarding response into a real ProfileSnapshot`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; testes focados do app passaram com `--watchman=false --forceExit` (6 suites / 37 testes); integração backend ainda pendente porque o script tenta `prisma migrate reset` no datasource configurado e precisa de ambiente local/test seguro
- Decisão final: liberado para avançar para `motor-ranking-popularidade-recomendacao`
- Próximo passo: revisar `motor-ranking-popularidade-recomendacao`

### 4. `feed-descoberta-personalizada`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 5 tasks escaneadas)
- Review round: `.compozy/tasks/feed-descoberta-personalizada/reviews-001/`
- Issues encontradas: 1 medium
- Correções aplicadas: `issue_001.md` marcada como `resolved`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; `npm run lint` no `app` passou com 0 erros e 4 warnings já conhecidos; testes focados do app passaram com `--watchman=false --forceExit` (2 suites / 7 testes)
- Decisão final: liberado para avançar para `busca-filtros-ver-tudo`
- Próximo passo: revisar `busca-filtros-ver-tudo`

### 5. `motor-ranking-popularidade-recomendacao`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/motor-ranking-popularidade-recomendacao/reviews-001/`
- Issues encontradas: 1 high, 1 medium
- Correções aplicadas: `issue_001.md` e `issue_002.md` marcadas como `resolved`; commits `f4e3266 fix(api): forward userId through listTopOfWeek so feed applies diet tie-break` e `fb6e49a fix(api): sum active editorial boosts instead of overwriting by recipe`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; `npm run lint` no `api` passou; testes focados do backend passaram com `--watchman=false` (5 suites / 87 testes); integração backend não executada nesta etapa porque o script de integração reseta o datasource configurado
- Decisão final: liberado para avançar para `feed-descoberta-personalizada`
- Próximo passo: revisar `feed-descoberta-personalizada`

### 6. `busca-filtros-ver-tudo`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/busca-filtros-ver-tudo/reviews-001/`
- Issues encontradas: 1 high, 2 medium
- Correções aplicadas: `issue_001.md`, `issue_002.md` e `issue_003.md` marcadas como `resolved`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; `npm run lint` no `api` passou; `npm run lint` no `app` passou com 0 erros e 4 warnings já conhecidos; testes focados do backend passaram com `--watchman=false` (3 suites / 25 testes); testes focados do app passaram com `--watchman=false --forceExit` (3 suites / 13 testes)
- Decisão final: liberado para avançar para `detalhe-receita-recalculo-porcoes`
- Próximo passo: revisar `detalhe-receita-recalculo-porcoes`

### 7. `detalhe-receita-recalculo-porcoes`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/detalhe-receita-recalculo-porcoes/reviews-001/`
- Issues encontradas: 1 high, 1 medium
- Correções aplicadas: `issue_001.md` e `issue_002.md` marcadas como `resolved`; commits `9df69c8 fix(api): return real isFavorited state for authenticated recipe detail` e `6dbdf2d fix(app): track recipe_opened with origin deep_link for universal link opens`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; testes focados do backend passaram com `--watchman=false` (1 suite / 35 testes); testes focados do app passaram com `--watchman=false --forceExit` (2 suites / 12 testes)
- Decisão final: liberado para avançar para `favoritos`
- Próximo passo: revisar `favoritos`

### 8. `preparo-guiado`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 5 tasks escaneadas)
- Review round: `.compozy/tasks/preparo-guiado/reviews-001/`
- Issues encontradas: 3 high, 1 medium
- Correções aplicadas: `issue_001.md`, `issue_002.md`, `issue_003.md` e `issue_004.md` marcadas como `resolved`; commits `c07f4f1 fix(api): preserve existing comment text on rating-only updates`, `26c694a fix(guided-cooking): cancel scheduled timer notification on session abandon`, `ba1d216 fix(app): reload guided cooking session when the route slug changes` e `9335d05 fix(guided-cooking): attach session Authorization header to analytics flush`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; `npm run lint` no `api` passou; `npm run lint` no `app` passou com 0 erros e 4 warnings já conhecidos; testes focados do backend passaram com `--watchman=false` (2 suites / 12 testes); testes focados do app passaram com `--watchman=false --forceExit` (3 suites / 36 testes)
- Decisão final: liberado para avançar para `perfil-configuracoes`
- Próximo passo: revisar `perfil-configuracoes`

### 9. `favoritos`

- Status: `Validado`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/favoritos/reviews-001/`
- Issues encontradas: 2 high, 1 medium
- Correções aplicadas: `issue_001.md`, `issue_002.md` e `issue_003.md` marcadas como `resolved`; commits `50453c5 fix(app): render reconciled favorites without a cached recipe detail`, `06ba9a9 fix(app): reconcile all pages of server favorites, not just the first` e `5db0711 fix(app): mock onAuthStateChange for favorites store user-scoping subscription`
- QA funcional: em 2026-07-30, `tasks validate` passou novamente; `npm run lint` no `app` passou com 0 erros e 4 warnings já conhecidos; testes focados do backend passaram com `--watchman=false` (3 suites / 43 testes); testes focados do app passaram com `--watchman=false --forceExit` (3 suites / 28 testes)
- Decisão final: liberado para avançar para `preparo-guiado`
- Próximo passo: revisar `preparo-guiado`

### 10. `perfil-configuracoes`

- Status: `Validado`
- `tasks validate`: passou em 2026-08-02 (`all tasks valid`, 2 tasks escaneadas)
- Review round: `.compozy/tasks/perfil-configuracoes/reviews-001/`
- Issues encontradas: 1 critical
- Correções aplicadas: `issue_001.md` marcada como `resolved`; task 2 implementada com store de tema, service/profile VM, avatar, telas de settings e testes UT-001 a UT-014
- QA funcional: em 2026-08-02, testes focados do app passaram com `--watchman=false --forceExit` (7 suites / 27 testes); `tasks validate` passou novamente
- Decisão final: liberado para avançar para `criacao-envio-receitas`
- Próximo passo: revisar `criacao-envio-receitas`

### 11. `criacao-envio-receitas`

- Status: `Validado`
- `tasks validate`: passou em 2026-08-03 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/criacao-envio-receitas/reviews-001/`
- Issues encontradas: 2 high
- Correções aplicadas: `issue_001.md` e `issue_002.md` marcadas como `resolved`; commits `923b5bb fix(recipe-authoring): skip enqueuing partial drafts to sync queue` e `91e7cca fix(recipe-authoring): retry failed cover-image attach PATCH on reconnect`
- QA funcional: em 2026-08-03, `tasks validate` passou novamente; testes focados do app passaram com `--watchman=false --forceExit` (2 suites / 15 testes); `npm run lint` no app passou com 0 erros e 4 warnings já conhecidos
- Decisão final: liberado para avançar para `painel-administrativo-moderacao`
- Próximo passo: revisar `painel-administrativo-moderacao`

### 12. `painel-administrativo-moderacao`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 13. `comentarios-avaliacoes`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:
