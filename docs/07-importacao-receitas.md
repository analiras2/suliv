# Importação de Receitas — Suliv

| Campo | Valor |
|---|---|
| Documentos de origem | [02-prd.md](./02-prd.md), [04-data-contract-schema-spec.md](./04-data-contract-schema-spec.md) |
| Módulo | `api/src/recipe-import/` |
| Status | Implementado |
| Criado em | 2026-08-05 |
| Última atualização | 2026-08-05 |

> Pipeline manual que busca receitas veganas de um provedor externo, traduz para pt-BR e entrega na fila de moderação existente. Não é um serviço automático: roda por comando, na máquina de quem opera.

## 1. Por que existe

O app precisa de conteúdo novo entrando com regularidade sem depender só de submissão de usuária. Este pipeline preenche essa lacuna importando receitas de terceiros, mas **nunca publica direto**: tudo entra como `em_analise` e passa pelo painel de moderação (feature 12 do [06-features-catalog.md](./06-features-catalog.md)), exatamente como uma receita enviada por usuária.

Três restrições moldaram o desenho:

1. **O conteúdo da fonte é em inglês; o app é pt-BR.** O PRD (§19.5.4) define que o MVP é só pt-BR e que i18n no MVP significa strings de UI, não tradução de conteúdo. Receita em inglês no feed contraria isso — e o `search_vector` usa `to_tsvector('portuguese', ...)`, então título em inglês fica praticamente invisível na busca.
2. **A cota da API externa é diária e pequena.** O plano free do provedor dá 50 pontos/dia. Buscar é caro; promover não custa nada. Isso empurrou o desenho para duas fases separadas.
3. **Qualidade de tradução importa em ingrediente.** Nome de ingrediente errado tem impacto direto no app, então a tradução é validada estruturalmente e ainda passa pela revisão humana da moderação.

## 2. Arquitetura em duas fases

```
Spoonacular ──(busca, cara)──▶ recipe_import_candidates ──(promoção, grátis)──▶ recipes (em_analise)
                                  "pool de reserva"                                fila de moderação
```

**Fase 1 — abastecer o pool.** Busca receitas na Spoonacular e grava o resultado mapeado, ainda em inglês, na tabela `recipe_import_candidates`. Roda **só quando o pool está baixo** (menos de `MIN_POOL_SIZE = 100` candidatos não promovidos).

**Fase 2 — promover.** Pega os N candidatos não promovidos mais antigos, traduz para pt-BR e cria as `recipes` correspondentes com `status = em_analise`. Não toca na API externa.

A separação existe porque as duas fases têm custos assimétricos. Uma busca gasta cota que não volta; uma promoção é só banco. Enchendo o pool de uma vez (~400 receitas) e promovendo aos poucos, as dezenas de execuções seguintes saem sem gastar nada — e se o provedor mudar de preço ou cortar o free tier, ainda há estoque para promover.

### Custo da busca

O endpoint `complexSearch` cobra `1 ponto + 0,01 por resultado`, e cada flag extra soma `0,025 por receita`. Usamos quatro flags (`fillIngredients`, `addRecipeInformation`, `addRecipeInstructions`, `addRecipeNutrition`), então cada receita custa `0,11`:

| Operação | Cálculo | Pontos |
|---|---|---|
| 1 página de 100 | `1 + 0,11 × 100` | 12 |
| 1 abastecimento (4 páginas) | `4 × 12` | **48** de 50/dia |

Por isso o abastecimento é condicional. Se ele rodasse a cada execução, duas execuções no mesmo dia estourariam a cota e a segunda voltaria erro `402`.

## 3. Tradução (EN → pt-BR)

Acontece **na promoção**, não na busca. O pool guarda o inglês original intacto — então a tradução é não-destrutiva e, se o dia de traduzir para espanhol/inglês chegar, dá para retraduzir da fonte preservada sem gastar cota da Spoonacular de novo.

- **Modelo:** `claude-sonnet-5`, via `@anthropic-ai/sdk`.
- **Uma chamada por receita**, com título, descrição, ingredientes e passos juntos — o modelo traduz "cup" → "xícara" com o contexto da receita inteira, em vez de campo a campo.
- **Structured outputs** (`output_config.format` com JSON Schema): a resposta vem com formato garantido, sem parsing de texto livre.
- **`effort: 'low'`** — a tarefa é estreita e bem especificada; o schema garante a forma independentemente.

### Validações que evitam corrupção silenciosa

| Validação | Por que existe |
|---|---|
| `stop_reason === 'refusal'` tratado antes de ler o conteúdo | Uma recusa retorna HTTP 200 com conteúdo vazio; ler `content[0]` direto quebraria |
| Contagem de ingredientes e passos precisa bater | A promoção remapeia os nomes traduzidos **por índice**. Se o modelo somasse ou removesse um item, a quantidade errada ficaria colada no ingrediente errado — em silêncio |
| Shape do payload conferido campo a campo | Protege contra resposta fora do schema |

Qualquer uma dessas falhas lança `RecipeTranslationError`, a promoção daquele candidato é abortada e ele **fica no pool** para a próxima execução tentar de novo. Nunca publica inglês na fila de moderação.

Depois de validada, a lista traduzida de ingredientes também alimenta a classificação automática de alérgenos. A promoção compara cada nome completo normalizado com o catálogo administrativo `allergen_ingredient_terms`, grava a projeção `recipe_allergens` e marca o candidato como promovido na **mesma transação**. Portanto, o classificador usa exatamente os nomes pt-BR que serão exibidos no app.

## 4. Mapeamento de dados

O que a Spoonacular devolve não encaixa direto nos enums do [04-data-contract-schema-spec.md](./04-data-contract-schema-spec.md). O mapper (`recipe-import.mapper.ts`) faz a ponte:

| Campo Suliv | Origem | Regra |
|---|---|---|
| `category` | `dishTypes[]` | Tabela de-para (`breakfast` → `cafe_da_manha`, `dessert` → `sobremesa`, …). Sem correspondência → `almoco_jantar` |
| `difficulty` | `readyInMinutes` | ≤ 20min → `iniciante`; ≤ 45min → `intermediario`; acima → `avancado` |
| `unit` (ingrediente) | `unit` textual | Tabela de-para (`grams` → `g`, `cups` → `xicara`, `tbsp` → `colher_sopa`, …). Sem correspondência → `unidade` |
| `timeBucket` | `prepTimeMinutes` | Reusa `deriveTimeBucket()` de `recipes.service.ts` — mesma regra das receitas de usuária |
| `description` | `summary` | HTML removido |
| `dietPreference` | — | Sempre `vegano` (a busca já filtra `diet=vegan`) |
| `authorId` | — | Sempre `null` (receita sem autoria) |
| `status` | — | Sempre `em_analise` |
| `recipe_allergens` | nomes de ingredientes traduzidos | comparação exata com o catálogo `allergen_ingredient_terms` de alérgenos aprovados; vínculo derivado na transação de promoção |

> **`difficulty` é uma aproximação.** A Spoonacular não expõe dificuldade; tempo de preparo é o sinal mais próximo. O moderador pode corrigir no painel.

Receita sem ingredientes ou sem passos é descartada no mapeamento — não entra no pool.

## 5. Modelo de dados

Duas migrations dão suporte ao pipeline:

**`20260805120000_add_recipe_external_source_id`** — adiciona em `recipes`:

| Coluna | Tipo | Uso |
|---|---|---|
| `external_source_id` | `TEXT UNIQUE` | Identifica a receita na origem (`spoonacular:661430`). É o que impede reimportar a mesma receita |
| `external_nutrition_data` | `JSONB` | Payload nutricional bruto, capturado no import e **não lido por nenhuma feature ainda** |

**`20260805130000_add_recipe_import_candidates`** — cria `recipe_import_candidates`, o pool. Mesmos campos da receita mapeada, mais:

| Coluna | Uso |
|---|---|
| `fetched_at` | Ordena a promoção (mais antigo primeiro) |
| `promoted_at` | `NULL` = ainda no pool. Indexado, porque toda consulta filtra por ele |

### Sobre o dado nutricional

Capturamos nutrição agora mesmo sem feature que a consuma. O motivo: custa só `+0,025 ponto` por receita no momento do import, mas rebuscar uma receita específica no futuro não é garantido — o provedor pode remover o id ou mudar de preço. É reserva de dado, não código morto: nada lê, e quando a feature de nutrição for desenhada o dado já está lá.

## 6. Como usar

### Pré-requisitos

**1. Migrations aplicadas:**

```bash
cd api && npx prisma migrate deploy
```

**2. Variáveis de ambiente em `api/.env`:**

| Variável | Obrigatória | Observação |
|---|---|---|
| `SPOONACULAR_API_KEY` | Sim | Chave do plano free em [spoonacular.com/food-api](https://spoonacular.com/food-api). A API não sobe sem ela |
| `ANTHROPIC_API_KEY` | Não localmente | Se não estiver definida, o SDK cai no perfil de `ant auth login`. **Em produção, defina** |
| `DATABASE_URL` | Sim | Já configurada para o projeto |

Para usar o perfil local em vez de chave:

```bash
ant auth login
```

### Executar

Importa 10 receitas (padrão):

```bash
cd api && npm run import:recipes
```

Importa uma quantidade específica:

```bash
cd api && npm run import:recipes -- 25
```

O comando sobe o container de injeção de dependência **sem servidor HTTP**, roda uma importação e encerra. Sai com código `0` em sucesso e `1` em erro, então dá para encadear em script.

### O que esperar no log

Primeira execução (pool vazio, busca acontece):

```
[RecipeImportService] Fetched 387 new candidate(s); promoted 10 for moderation review.
```

Execuções seguintes (pool cheio, sem gasto de cota):

```
[RecipeImportService] Pool has 377 pending candidate(s); skipping fetch.
[RecipeImportService] Fetched 0 new candidate(s); promoted 10 for moderation review.
```

Candidato pulado (não é erro — ele volta na próxima):

```
[RecipeImportService] Skipping "Vegan Lentil Soup": translation failed (...).
```

### Depois de rodar

As receitas aparecem no painel de moderação com status `em_analise`, junto das submissões de usuária. Nada vai ao ar sem aprovação humana.

## 7. Comportamento em falha

| Situação | O que acontece |
|---|---|
| Tradução falha (API fora, recusa, contagem divergente) | Candidato **não** é promovido, fica no pool, próxima execução tenta de novo |
| Categoria sem linha correspondente em `categories` | Candidato pulado com aviso; verifique se o seed de categorias rodou |
| Receita já importada antes | Ignorada silenciosamente (`external_source_id` é único) |
| Cota da Spoonacular esgotada | A busca retorna `402`. Rode de novo no dia seguinte, ou promova do pool sem buscar |
| Chave de API ausente | `SPOONACULAR_API_KEY` faltando impede o boot; credencial Anthropic ausente falha na tradução |

## 8. Onde mexer

| Quero mudar | Arquivo |
|---|---|
| Quantas receitas por execução (padrão) | `DEFAULT_PROMOTION_COUNT` em `recipe-import.service.ts` |
| Quando o pool é reabastecido | `MIN_POOL_SIZE` em `recipe-import.service.ts` |
| Quantas páginas por abastecimento | `PAGES_PER_REFILL` em `recipe-import.service.ts` |
| Filtros da busca externa | `spoonacular.client.ts` |
| De-para de categoria, unidade, dificuldade | `recipe-import.mapper.ts` |
| Modelo ou instruções de tradução | `recipe-translation.service.ts` |

> **Cuidado ao mexer em `PAGES_PER_REFILL`:** cada página custa 12 pontos de um orçamento diário de 50. Cinco páginas (60 pontos) estouram a cota do plano free.

## 9. Limites conhecidos

- **Não é automático.** Por decisão explícita, roda por comando. Não há cron, e `@nestjs/schedule` não é dependência do projeto.
- **`difficulty` é estimada** por tempo de preparo, não informada pela fonte.
- **Classificação por termos explícitos.** A importação classifica os ingredientes pt-BR em `recipe_allergens`, como os demais caminhos de escrita de receita. A regra só reconhece nomes completos presentes em `allergen_ingredient_terms`; não detecta contaminação cruzada, ingredientes ocultos ou variações ainda não cadastradas. Ausência de match não é garantia de segurança. Depois de alterar o catálogo, rode `npm run allergens:backfill` para recalcular receitas históricas.
- **Uma fonte só.** O `external_source_id` já é prefixado (`spoonacular:`), então adicionar outro provedor não exige mudança de schema — só um novo client e mapper.
