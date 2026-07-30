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

- `splash-bootstrap-modo-offline`

Passos imediatos:

1. Rodar `compozy tasks validate --name splash-bootstrap-modo-offline`
2. Abrir a rodada manual de review dessa feature
3. Registrar os issues encontrados
4. Corrigir antes de passar para `onboarding-obrigatorio`

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

- Status: `Review concluído, com issues`
- `tasks validate`: passou em 2026-07-30 (`all tasks valid`, 4 tasks escaneadas)
- Review round: `.compozy/tasks/splash-bootstrap-modo-offline/reviews-001/`
- Issues encontradas: 1 high
- Correções aplicadas: nenhuma nesta etapa; review-only
- QA funcional: testes focados do app passaram com `--watchman=false` (6 suites / 33 testes), mas com warnings de `act()` no teste de retry; Maestro não executado nesta etapa
- Decisão final: precisa corrigir antes de avançar para `onboarding-obrigatorio`
- Próximo passo: rodar `compozy reviews fix splash-bootstrap-modo-offline --ide codex`

### 3. `onboarding-obrigatorio`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 4. `feed-descoberta-personalizada`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 5. `motor-ranking-popularidade-recomendacao`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 6. `busca-filtros-ver-tudo`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 7. `detalhe-receita-recalculo-porcoes`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 8. `preparo-guiado`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 9. `favoritos`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 10. `perfil-configuracoes`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

### 11. `criacao-envio-receitas`

- Status:
- `tasks validate`:
- Review round:
- Issues encontradas:
- Correções aplicadas:
- QA funcional:
- Decisão final:
- Próximo passo:

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
