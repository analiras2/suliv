

**SULIV**

Ecossistema de Decisão Alimentar Consciente

**Documentação de Produto — MVP**

Versão 1.0  ·  Abril 2026

*Confidencial — Para uso interno*

# 1\. Visão Geral do Produto

## 1.1 Missão

A Suliv é um ecossistema de decisão alimentar consciente, focado em ajudar pessoas a adotarem uma alimentação plant-based de forma prática, educativa e sustentável.

## 1.2 Pilares do produto

| Fase | Pilar | Status | Escopo |
| :---- | :---- | ----- | :---- |
| **MVP** | **Cooking** | **Core ativo** | Receitas · Assistente (futuro) · Execução |
| V2 | Nutrição | **Planejado** | Perfil nutricional · Macros · Restrições |
| V3 | Sustentabilidade | **Futuro** | CO₂ · Água · Uso de terra |
| V4 | Scanner | **Futuro** | Scan de produto · Ingredientes · Nutri |
| V5 | Mapa Local | **Futuro** | Restaurantes · Mercados · Parcerias |

## 1.3 Decisão estratégica do assistente

O assistente de culinária será construído após a fase MVP, quando houver contexto suficiente do usuário (histórico de receitas, preferências, restrições). Sem esse contexto, o assistente não oferece vantagem competitiva real sobre ferramentas genéricas como ChatGPT.

**Diretriz:** Desde o MVP, coletar dados estruturados do usuário logado para alimentar o assistente no futuro. Isso é investimento de dados, não feature de UX ainda.

# 2\. Arquitetura do Sistema

## 2.1 Diagrama de fluxo geral (Mermaid)

*Copie o código abaixo para visualizar em mermaid.live ou qualquer renderer compatível.*

\`\`\`mermaid

flowchart TD

    A(\[Usuário\]) \--\> B\[Onboarding & Cadastro\]

    B \--\> C{Perfil completo?}

    C \--\>|Não| D\[Coleta de Preferências\]

    D \--\> C

    C \--\>|Sim| E\[Home — Feed de Receitas\]

    E \--\> F\[Busca & Filtros\]

    E \--\> G\[Detalhe da Receita\]

    G \--\> H\[Modo Execução\]

    H \--\> H1\[Checklist de ingredientes\]

    H \--\> H2\[Timer por etapa\]

    H \--\> H3\[Passos interativos\]

    H \--\> I{Receita concluída?}

    I \--\>|Sim| J\[Avaliação \+ Coleta de dados\]

    I \--\>|Não| H

    J \--\> K\[(User Data Store)\]

    K \--\> L\[Futuro: Assistente Contextual\]

    E \--\> M\[Favoritos & Histórico\]

    M \--\> K

\`\`\`

## 2.2 Diagrama de entidade-relacionamento (ERD)

*Representa o modelo de dados do MVP com coleta estratégica para o assistente futuro.*

\`\`\`mermaid

erDiagram

    USER {

        uuid id PK

        string name

        string email

        string avatar\_url

        timestamp created\_at

        timestamp last\_active\_at

    }

    USER\_PROFILE {

        uuid id PK

        uuid user\_id FK

        string\[\] dietary\_restrictions

        string\[\] allergens

        string\[\] preferred\_cuisines

        string skill\_level

        int avg\_cook\_time\_min

        int household\_size

        timestamp updated\_at

    }

    RECIPE {

        uuid id PK

        string title

        string slug

        string\[\] tags

        int prep\_time\_min

        int cook\_time\_min

        string difficulty

        float co2\_kg

        float water\_liters

        int servings

        json nutrition\_per\_serving

        timestamp created\_at

    }

    INGREDIENT {

        uuid id PK

        string name

        string category

        string unit\_default

        float co2\_per\_100g

        json nutrition\_per\_100g

    }

    RECIPE\_INGREDIENT {

        uuid id PK

        uuid recipe\_id FK

        uuid ingredient\_id FK

        float quantity

        string unit

        boolean optional

    }

    RECIPE\_STEP {

        uuid id PK

        uuid recipe\_id FK

        int order

        string instruction

        int timer\_seconds

    }

    USER\_RECIPE\_LOG {

        uuid id PK

        uuid user\_id FK

        uuid recipe\_id FK

        boolean completed

        int rating

        string\[\] substitutions\_made

        int actual\_cook\_time\_min

        timestamp cooked\_at

    }

    USER\_FAVORITE {

        uuid id PK

        uuid user\_id FK

        uuid recipe\_id FK

        timestamp saved\_at

    }

    USER ||--|| USER\_PROFILE : "tem"

    USER ||--o{ USER\_RECIPE\_LOG : "cozinha"

    USER ||--o{ USER\_FAVORITE : "favorita"

    RECIPE ||--o{ RECIPE\_INGREDIENT : "contém"

    RECIPE ||--o{ RECIPE\_STEP : "possui"

    RECIPE ||--o{ USER\_RECIPE\_LOG : "registrada em"

    RECIPE ||--o{ USER\_FAVORITE : "salva em"

    INGREDIENT ||--o{ RECIPE\_INGREDIENT : "usada em"

\`\`\`

## 2.3 Sequence diagram — Modo execução

\`\`\`mermaid

sequenceDiagram

    actor U as Usuário

    participant App as App (RN)

    participant API as API (Backend)

    participant DB as Database

    U-\>\>App: Toca em "Cozinhar agora"

    App-\>\>API: GET /recipes/:id/steps

    API-\>\>DB: SELECT steps WHERE recipe\_id

    DB--\>\>API: steps\[\]

    API--\>\>App: { steps, ingredients }

    App--\>\>U: Exibe checklist de ingredientes

    U-\>\>App: Confirma ingredientes disponíveis

    App--\>\>U: Exibe Passo 1 \+ inicia timer

    loop Para cada passo

        U-\>\>App: Marca passo como concluído

        App--\>\>U: Avança para próximo passo

        opt Tem timer

            App--\>\>U: Dispara countdown

        end

    end

    U-\>\>App: Conclui receita

    App-\>\>API: POST /user/recipe-log

    note right of API: { recipe\_id, completed: true,

    note right of API:   actual\_time, substitutions }

    API-\>\>DB: INSERT user\_recipe\_log

    DB--\>\>API: ok

    API--\>\>App: log\_id

    App--\>\>U: Tela de conclusão \+ avaliação

    U-\>\>App: Avalia receita (1–5)

    App-\>\>API: PATCH /user/recipe-log/:id

    API-\>\>DB: UPDATE rating

\`\`\`

# 3\. Estratégia de Coleta de Dados do Usuário

Esta seção define quais dados devem ser coletados desde o MVP para viabilizar o assistente contextual no futuro. Todos os campos abaixo devem ser armazenados no backend independente de serem exibidos na UI inicial.

## 3.1 Dados coletados no onboarding

| Campo | Tipo | Obrigatório | Propósito futuro |
| :---- | :---- | ----- | :---- |
| Restrições alimentares | string\[\] (multiselect) | **Sim** | Filtrar sugestões do assistente |
| Alergias | string\[\] (multiselect) | **Sim** | Bloquear ingredientes perigosos |
| Nível de habilidade | enum (iniciante/médio/avançado) | **Sim** | Calibrar complexidade das sugestões |
| Tamanho do domicílio | int (1–8+) | **Não** | Ajustar porções automaticamente |
| Tempo disponível médio | enum (\<20min / 20–45 / 45+) | **Não** | Filtrar por tempo de preparo |
| Culinária preferida | string\[\] (multiselect) | **Não** | Personalizar feed e sugestões |
| Objetivo principal | enum (saúde/sustentab./custo) | **Não** | Priorizar conteúdo relevante |

## 3.2 Dados coletados passivamente (uso do app)

| Evento | Dados capturados | Tabela |
| :---- | :---- | :---- |
| **Receita cozinhada** | recipe\_id, completed, actual\_time, substitutions\_made, rating | user\_recipe\_log |
| **Receita favoritada** | recipe\_id, timestamp | user\_favorite |
| **Receita visualizada** | recipe\_id, view\_duration\_sec, source (busca/feed/indicação) | user\_recipe\_view |
| **Busca realizada** | query, filters, results\_count, result\_clicked | user\_search\_log |
| **Passo pulado no modo exec.** | step\_id, reason (se informado) | user\_execution\_log |
| **Substituição feita** | original\_ingredient\_id, substitute\_used | user\_substitution\_log |

# 4\. Product Requirements — PDR

Requisitos rastreáveis do MVP. Prioridade segue convenção MoSCoW: Must (obrigatório), Should (importante), Could (desejável), Won't (fora de escopo).

## 4.1 Legenda de prioridade

| Prioridade | Definição |
| ----- | :---- |
| **Must** | Bloqueador do MVP — app não lança sem isso. |
| **Should** | Alta importância, pode ir em hotfix pós-lançamento. |
| **Could** | Nice to have — entra se houver capacidade. |
| **Won't** | Explicitamente fora do escopo do MVP. |

## 4.2 Autenticação & Perfil

| ID | Título | Descrição | Prior. | Critério de aceite |
| :---- | :---- | :---- | ----- | :---- |
| **SUL-01** | **Cadastro com e-mail** | O usuário deve conseguir criar uma conta com e-mail e senha. O campo de senha deve exigir mínimo 8 caracteres com ao menos 1 número. | **Must** | Conta criada, e-mail de confirmação enviado, usuário redirecionado para onboarding. |
| **SUL-02** | **Login social (Google/Apple)** | O usuário deve conseguir autenticar via Google ou Apple ID. O token OAuth deve ser trocado por um JWT interno. | **Must** | Login realizado em \< 3 toques. Usuário existente não repete onboarding. |
| **SUL-03** | **Onboarding de perfil** | Após o cadastro, o usuário deve passar por um fluxo de 3–5 telas coletando: restrições, alergias, nível de habilidade e tempo disponível. Campos opcionais claramente indicados. | **Must** | Dados salvos em user\_profile. Usuário pode pular campos opcionais sem erro. |
| **SUL-04** | **Edição de perfil** | O usuário deve conseguir editar qualquer campo do perfil a qualquer momento via Configurações. | **Should** | Alteração refletida imediatamente no feed e filtros. |

## 4.3 Receitas & Descoberta

| ID | Título | Descrição | Prior. | Critério de aceite |
| :---- | :---- | :---- | ----- | :---- |
| **SUL-05** | **Feed de receitas** | A tela inicial deve exibir um feed de receitas plant-based. No MVP, a ordenação é cronológica inversa. Receitas filtradas pelas restrições do usuário são ocultadas por padrão. | **Must** | Feed carrega em \< 2s. Receitas com alérgenos do usuário não aparecem. |
| **SUL-06** | **Busca por nome em tempo real** | O usuário deve conseguir filtrar receitas pelo nome através de um campo de busca com debounce de 300ms. A busca deve ser case-insensitive e tolerar acentos. | **Must** | Resultados atualizam em \< 500ms após pausa de digitação. "Arroz" encontra "Arroz negro com lentilha". |
| **SUL-07** | **Filtros por categoria** | O usuário deve conseguir filtrar receitas por: tempo de preparo, dificuldade, categoria (café, almoço, jantar, lanche, sobremesa) e ingrediente principal. Múltiplos filtros combinados com AND. | **Must** | Filtros mantidos ao navegar para receita e voltar. Badge conta filtros ativos. |
| **SUL-08** | **Detalhe da receita** | A tela de detalhe deve exibir: título, imagem, tempo, dificuldade, porções (ajustável), ingredientes, passos, e informação nutricional. Ingredientes com alérgenos do usuário destacados em vermelho. | **Must** | Ajuste de porções recalcula quantidades em tempo real sem requisição ao backend. |
| **SUL-09** | **Favoritar receita** | O usuário logado deve conseguir salvar/remover receitas dos favoritos com um único toque. Estado persistido no backend. | **Must** | Toggle responsivo (\< 200ms feedback visual). Estado correto após reiniciar o app. |

## 4.4 Modo Execução

| ID | Título | Descrição | Prior. | Critério de aceite |
| :---- | :---- | :---- | ----- | :---- |
| **SUL-10** | **Checklist de ingredientes** | Antes de iniciar o modo execução, o usuário deve ver a lista de ingredientes com checkboxes. Deve haver opção de substituir qualquer ingrediente (texto livre no MVP). A substituição é registrada em user\_substitution\_log. | **Must** | Checklist não bloqueia início — usuário pode prosseguir com itens desmarcados. |
| **SUL-11** | **Modo passo a passo** | O modo execução deve exibir um passo por vez com navegação anterior/próximo. O texto do passo deve ter fonte ≥ 18pt para leitura com as mãos sujas. | **Must** | Tela não hiberna durante o modo execução (wakelock ativo). |
| **SUL-12** | **Timer por etapa** | Passos com tempo definido devem exibir um timer countdown com notificação local ao zerar. O timer deve continuar em background. O usuário pode pausar/retomar. | **Must** | Notificação disparada mesmo com app em background. Timer retoma corretamente após retorno ao app. |
| **SUL-13** | **Log de conclusão** | Ao concluir a receita, o sistema deve registrar automaticamente: recipe\_id, completed: true, actual\_cook\_time\_min e substitutions\_made em user\_recipe\_log. | **Must** | Log criado mesmo se o usuário fechar o app antes da tela de avaliação. |
| **SUL-14** | **Avaliação pós-receita** | Após conclusão, o usuário deve ver uma tela simples com avaliação de 1–5 estrelas e campo de texto opcional (max 280 chars). Pode ser pulada. | **Should** | Rating salvo em user\_recipe\_log.rating. Tela não bloqueia navegação. |

## 4.5 Coleta de dados & Contexto futuro

| ID | Título | Descrição | Prior. | Critério de aceite |
| :---- | :---- | :---- | ----- | :---- |
| **SUL-15** | **Tracking de eventos de uso** | O app deve registrar em background: receitas visualizadas (+ duração), buscas realizadas (+ resultado clicado) e passos pulados no modo execução. Nenhuma PII nestas tabelas. | **Must** | Eventos enviados em batch a cada 30s ou ao minimizar o app. Não bloqueia UI em caso de falha. |
| **SUL-16** | **Histórico do usuário** | O usuário deve acessar seu histórico de receitas cozinhadas com data, avaliação dada e se concluiu. Ordenado do mais recente. | **Should** | Histórico visível offline (cache local). Paginação de 20 itens. |

# 5\. Fora do Escopo do MVP

Os itens abaixo foram deliberadamente excluídos do MVP. Qualquer mudança nessa lista deve ser discutida e documentada com justificativa.

| Feature | Justificativa de exclusão |
| :---- | :---- |
| **Assistente de IA / chatbot** | Sem contexto suficiente do usuário. Construir após acumular histórico de uso (ver SUL-13, SUL-15, SUL-16). |
| **Scanner de produtos (câmera)** | Alta complexidade técnica. Depende de base de dados de ingredientes robusta. Planejado para V4. |
| **Mapa de restaurantes** | Requer massa crítica de usuários e curadoria manual contínua. Planejado para V5. |
| **Cálculo de impacto ambiental** | Requer fonte de dados verificável (Open Food Facts, IPCC). Lançar dado incorreto destrói credibilidade. Planejado para V3. |
| **Plano alimentar semanal** | Feature de alto valor mas complexidade de UX elevada. Entra com o perfil nutricional no V2. |
| **Lista de compras inteligente** | Depende de integração com estoque do usuário. Requer contexto que só estará disponível após meses de uso. |
| **Modo offline completo** | Cache básico de histórico é suficiente no MVP (ver SUL-16). Modo offline total eleva complexidade desnecessariamente. |
| **Monetização / paywall** | Foco total em validação de retenção antes de monetizar. Nenhuma feature deve ser bloqueada por pagamento no MVP. |

# 6\. Métricas de Validação do MVP

O avanço para V2 (Nutrição) só deve ocorrer após atingir os thresholds abaixo. Período de medição: 60–90 dias pós-lançamento.

| Métrica | Threshold Go | Threshold No-go | O que indica |
| :---- | ----- | ----- | :---- |
| **D7 Retention** | **≥ 30%** | **\< 15%** | Valor percebido na primeira semana |
| **D30 Retention** | **≥ 15%** | **\< 8%** | Formação de hábito de uso |
| **Receitas concluídas / usuário / semana** | **≥ 2** | **\< 0,5** | Uso real do modo execução |
| **Taxa de execução checklist→fim** | **≥ 50%** | **\< 25%** | Qualidade do modo execução |
| **NPS (coletado no D14)** | **≥ 40** | **\< 20** | Satisfação e intenção de indicação |
| **Entrevistas qualitativas realizadas** | **≥ 15** | **\< 10** | Evidência qualitativa suficiente |

## 6.1 Anti-métricas (ignorar no MVP)

* Downloads totais — fácil inflar com ads, sem correlação com retenção.

* Usuários cadastrados — o que importa é quem usa, não quem criou conta e sumiu.

* Avaliações na App Store — viés de seleção alto, não representam o usuário médio.

* Tempo médio de sessão — sessão longa pode indicar confusão, não engajamento.