# Suliv - PRD Mestre do MVP

> Documento mestre de produto para alinhar backend, design e desenvolvimento no MVP do Suliv. Baseado em [01-marca.md](./01-marca.md). Detalhamento técnico em [03-tdd.md](./03-tdd.md) e [04-data-contract-schema-spec.md](./04-data-contract-schema-spec.md).

## 1. Visao do produto

**Proposta principal:** Suliv acompanha a execucao real do dia a dia plant-based - do "quero comer melhor" ao prato pronto - sem julgamento e sem radicalismo.

**Posicionamento do produto:** Suliv transforma a intencao de comer melhor em pratica cotidiana, com foco em confianca, repertorio e execucao guiada.

**Problema principal:** muita gente quer cozinhar melhor e comer de forma mais consciente, mas trava na falta de repertorio, na inseguranca e na dificuldade de transformar intencao em execucao.

**Diferencial central:** enquanto outras solucoes vivem na inspiracao, no feed ou na teoria, o Suliv vive no momento da execucao.

## 2. Objetivos e escopo do MVP

### 2.1 Objetivos do MVP

- Provar que preparo guiado gera valor real no momento da execucao.
- Ajudar usuarias a descobrir receitas plant-based de forma simples e personalizada.
- Permitir que usuarias contribuam com receitas proprias via fluxo moderado.
- Criar uma base consistente de dados comportamentais para calibrar ranking, onboarding e retencao.

### 2.2 Metricas de sucesso

- **Metrica-norte:** uso do preparo guiado.
- **Metricas principais:**
  - receitas enviadas para moderacao
  - porcoes recalculadas
  - abertura de receitas a partir do feed e da busca
  - favoritos salvos

### 2.3 Escopo do MVP

Entram no MVP:

- autenticacao por Magic Link, Google e Apple
- onboarding obrigatorio
- feed com listas personalizadas e categorias
- busca, filtros e telas de "ver tudo"
- detalhe da receita com recálculo de porcoes
- preparo guiado com timer por passo
- favoritos com acesso offline
- perfil e configuracoes basicas
- envio de receitas proprias com moderacao
- comentarios/avaliacoes
- notificacoes transacionais essenciais

Ficam fora do MVP:

- receitas relacionadas
- notificacoes de engajamento
- upload manual de avatar
- alteracao de email
- restauracao persistente do preparo guiado apos matar o app

### 2.4 Plataforma

- MVP e mobile-first (app nativo/React Native). Web nao e entregue no MVP.
- API e contrato de dados sao desenhados de forma agnostica de plataforma desde o inicio, para que um client web futuro consuma a mesma API sem retrabalho de backend.

## 3. Perfis de usuaria

### 3.1 Perfil 1 - Primario

**Iniciante que quer cozinhar melhor**

- Dor principal: nao sabe por onde comecar.
- Necessidade: execucao guiada, menos pressao, mais clareza.
- Valor central no Suliv: preparo guiado e receitas possiveis.

### 3.2 Perfil 2 - Secundario

**Pessoa com restricao alimentar**

- Dor principal: encontrar ou adaptar receitas com seguranca e menos pesquisa manual.
- Necessidade: sinalizacao clara de conflito, personalizacao e ajuste de receita.
- Valor central no Suliv: filtros soft, alertas e recálculo/adaptacao.

### 3.3 Perfil 3 - Secundario

**Pessoa que ja cozinha plant-based e quer repertorio/compartilhar**

- Dor principal: repertorio limitado e falta de espaco para compartilhar receitas.
- Necessidade: descoberta de variedade e autoria.
- Valor central no Suliv: "Minhas receitas" como pilar de produto.

## 4. Jornada principal e fluxo do app

### 4.1 Fluxo macro

1. Splash
2. Verificacao de sessao
3. Login, se necessario
4. Complementacao de dados obrigatorios da conta, se necessario
5. Onboarding obrigatorio
6. Feed
7. Busca, filtros, categorias e detalhe de receita
8. Preparo guiado
9. Favoritos
10. Perfil e configuracoes
11. Minhas receitas

### 4.2 Regras gerais do fluxo

- Nao existe tela separada de cadastro.
- Primeiro acesso cria conta automaticamente apos autenticacao.
- Onboarding e obrigatorio e nao pode ser pulado.
- Se login social vier sem nome ou email, a usuaria completa esses dados antes do onboarding.

## 5. Conta e autenticacao

### 5.1 Metodos de autenticacao

- Magic Link por email
- Google
- Apple

### 5.2 Dados obrigatorios da conta

- nome
- email
- username unico

### 5.3 Regras de username

- unico globalmente
- gerado automaticamente no primeiro acesso
- pode ser alterado pela usuaria
- apos alteracao, entra em cooldown de 30 dias
- sem sugestao automatica quando indisponivel
- 3 a 20 caracteres, permite letras, numeros, underscore e ponto
- filtro de profanidade basico aplicado na validacao

### 5.4 Regras de conta

- email nao e editavel no MVP
- conta pode nascer de login social ou Magic Link
- login social pode reutilizar foto do provedor
- sem upload manual de avatar no MVP

### 5.5 Sessao e token

- token de longa duracao (ex. 30 dias) com refresh silencioso
- multiplos dispositivos simultaneos sao permitidos por conta
- logout e por dispositivo, nao invalida sessao em outros aparelhos

### 5.6 Exclusao de conta (LGPD)

- usuaria pode solicitar exclusao da conta nas Configuracoes
- dados pessoais sao anonimizados na exclusao
- receitas publicadas pela usuaria permanecem no catalogo sem vinculo de autoria (autor exibido como "usuaria removida")

### 5.7 Aceite de termos

- aceite de termos guarda a versao do termo aceito e a data/hora
- se os termos mudarem, a usuaria precisa re-aceitar

### 5.8 Suporte para perda de acesso a email/provedor social

- sem fluxo de self-service automatizado no MVP (email nao e editavel - secao 5.4)
- usuaria sem acesso ao metodo de login original abre um canal de suporte manual (ex. email/formulario)
- suporte resolve caso a caso, migrando a conta manualmente quando necessario

## 6. Splash e estrategia offline

### 6.1 Objetivo da splash

- inicializar o app
- validar sessao
- decidir rota inicial
- carregar apenas dados criticos

### 6.2 Dados criticos carregados

- sessao/autenticacao
- perfil basico
- status do onboarding
- preferencias essenciais

### 6.3 Estrategia offline

- se houver sessao ativa e falha de rede, a usuaria pode entrar em modo offline
- modo offline do MVP permite acesso a favoritos e leitura do perfil/preferencias
- feed e busca nao funcionam offline

### 6.4 Comportamento em falha

- se falhar a inicializacao, a splash permanece na tela
- mostrar mensagem clara de erro
- exibir botao `Tentar novamente`
- sem sessao ativa e sem rede, o login fica bloqueado ate haver conexao

## 7. Onboarding

### 7.1 Regras gerais

- obrigatorio
- sem skip
- todas as perguntas sao obrigatorias
- objetivo e personalizar descoberta e execucao sem parecer formulario pesado

### 7.2 Etapa 1 - Estilo alimentar

Opcoes fechadas:

- vegano
- vegetariano
- flexitariano

Microcopy:

- **Vegano:** sem ingredientes de origem animal.
- **Vegetariano:** sem carne, com possibilidade de ovos e laticinios.
- **Flexitariano:** alimentacao flexivel, com interesse em receitas mais conscientes.

### 7.3 Etapa 2 - Alergias e restricoes

Base inicial fechada (7 itens - Peixes e Crustaceos/Moluscos removidos da lista funcional porque o catalogo e 100% plant-based e esses 2 itens nunca apareceriam como conflito real. Gergelim permanece: e um ingrediente plant-based comum (tahine, oleo de gergelim, sementes). Reativar peixe/crustaceo no futuro nao exige migration estrutural, so mudar o status na tabela `allergens`):

1. Leite
2. Ovos
3. Trigo (Gluten)
4. Amendoim
5. Castanhas e Nozes (Oleaginosas)
6. Soja
7. Gergelim

Regras:

- selecao com busca/autocomplete
- campo livre permitido quando nao houver termo equivalente
- novo termo entra como `pending normalization`
- termo pendente nao deve virar sinal confiavel de exclusao
- moderador revisa manualmente cada termo pendente
- termo aprovado vira opcao global no autocomplete para todas as usuarias

### 7.4 Etapa 3 - Nivel e frequencia na cozinha

Nivel:

- iniciante
- intermediario
- avancado

Frequencia (lista fechada):

- raramente
- algumas vezes por semana
- quase todo dia

Usada para personalizacao e analise de retencao (segmento "raramente" e alvo prioritario de ativacao).

### 7.5 Impacto do onboarding

- estilo alimentar afeta score e sinalizacao
- alergias/restricoes afetam score e alertas
- nivel afeta compatibilidade com dificuldade
- frequencia afeta compatibilidade com tempo e analise de retencao

## 8. Feed, busca, filtros e "ver tudo"

### 8.1 Estrutura do feed

1. Carrossel `Selecionadas para voce` com 5 receitas
2. Carrossel de categorias com opcao `Ver tudo`
3. Lista `Top 5 da semana` com opcao `Ver tudo`

### 8.2 Busca

- busca acessivel pelo navbar
- sem tela isolada fora do contexto principal de descoberta
- resultados usam scroll infinito

### 8.3 Filtros do MVP

- categoria
- tempo
- dificuldade
- preferencia alimentar
- alergias/restricoes

Popularidade nao e filtro. E criterio de ordenacao.

Categorias (lista fechada inicial):

- Cafe da manha
- Almoco/Jantar
- Lanche
- Sobremesa
- Bebida
- Molhos/Acompanhamentos

Faixas de tempo de preparo (lista fechada):

- ate 15min
- 15-30min
- 30-60min
- 60min+

### 8.4 Regra de filtros soft

- nenhuma receita e escondida por conflito de preferencia ou restricao
- o sistema reordena, penaliza score e sinaliza conflito
- a UI precisa deixar claro que o filtro destaca/ordena, nao exclui
- comunicacao na pratica: receitas compativeis aparecem primeiro na lista; receitas com conflito continuam visiveis mas exibem um selo discreto (ex. "contem gluten") em vez de sumir da lista - sem texto explicativo adicional na tela, a ordenacao + selo ja comunicam o comportamento

### 8.5 Telas de "ver tudo"

- `Ver tudo` leva para a tela de busca/listagem
- a tela mantem contexto da origem no titulo
- usa os mesmos filtros da busca
- usa scroll infinito

Ordenacao por origem:

- `Selecionadas para voce`: score personalizado
- `Categorias`: ordem editorial ou popularidade
- `Top da semana`: popularidade rolling de 7 dias, com leve compatibilidade

## 9. Ranking e recomendacao

### 9.1 Blocos com lógicas distintas

- `Selecionadas para voce`: score personalizado
- `Categorias`: editorial ou popularidade
- `Top da semana`: popularidade geral com leve reordenacao por compatibilidade

### 9.2 Score inicial de `Selecionadas para voce`

| Sinal | Peso inicial |
| --- | --- |
| Compatibilidade com preferencia base | +40 |
| Conflito com alergia/restricao | -80 |
| Dificuldade compativel com nivel | +20 |
| Tempo compativel com frequencia | +15 |
| Entre as populares da semana | +15 |
| Receita recente | +10 |
| Categoria com bom desempenho | +10 |
| Boost editorial manual | +X |

### 9.3 Regras do ranking

- os pesos sao hipotese inicial e devem ser calibrados pos-lancamento
- conflito com alergia/restricao penaliza forte, mas nao exclui
- `Top da semana` usa janela rolling de 7 dias corridos
- avaliacao (nota) nao entra no score no MVP - so exibida na receita

### 9.4 Cold start de conteudo novo

- 1 posicao do carrossel `Selecionadas para voce` e sempre reservada para conteudo recente compativel com o perfil, independente do piso de popularidade
- garante descoberta de receitas novas sem inflar o score delas artificialmente

### 9.5 Piso de elegibilidade para "Selecionadas para voce"

- fora da vaga reservada de cold start (9.4), uma receita so entra no carrossel `Selecionadas para voce` se atingir pelo menos 10 aberturas OU 3 conclusoes de guided cooking
- piso calibrado para o volume esperado de lancamento (poucas centenas de usuarias no inicio) - ajustar para cima conforme o trafego crescer, sem mudar a formula do score (9.2)

### 9.6 Formula de popularidade

- `popularidade = aberturas + 2x favoritos + 3x conclusoes de guided cooking`, somados na janela rolling dos ultimos 7 dias
- pesos refletem o custo/intencao de cada sinal (abrir < favoritar < cozinhar de fato) e sao coerentes com a metrica-norte
- usada em: `Top da semana`, piso de elegibilidade (9.5), sinal "+15 populares da semana" e "+10 categoria com bom desempenho" (media de popularidade das receitas da categoria)
- como os pesos do score (9.2), e hipotese inicial a calibrar pos-lancamento

## 10. Receita detalhe

### 10.1 Conteudo principal

- hero da receita
- selo de preferencia alimentar
- tempo de preparo
- dificuldade
- porcoes
- lista de ingredientes
- passos
- comentarios/avaliacoes
- CTA de favoritar

### 10.2 Regras de porcoes

- recálculo linear por padrao
- ingredientes podem ser marcados como `escala com porcao: sim/nao`
- itens como sal, pimenta e louro podem nao escalar
- tipo de porcao e sempre "porcoes" (numero de pessoas que a receita serve) - unidade unica para todas as receitas do MVP

Unidades de ingrediente padronizadas (lista fechada inicial):

- g, kg, ml, l, unidade, xicara, colher de sopa, colher de cha, pitada, a gosto
- `pitada` e `a gosto` nascem marcados como nao-escalaveis por padrao

### 10.3 Alerta de restricao/alergia

- faixa de alerta proxima da lista de ingredientes
- nao fica no cabecalho
- objetivo e contextualizar o conflito sem assustar antes da leitura
- sem sugestao de substituicao de ingrediente no MVP - a faixa so alerta, a usuaria decide como adaptar

### 10.4 Fora do MVP

- receitas relacionadas
- sugestao de substituicao de ingrediente em conflito de alergia (curadoria manual de mapeamento ingrediente->alternativa fica para depois)

## 11. Guided cooking

### 11.1 Objetivo

- transformar a leitura da receita em execucao real
- ser o principal motor de valor e retencao do MVP

### 11.2 Regras principais

- um unico timer ativo por vez
- timer sempre atrelado ao passo atual
- cada passo pode ter `tempo_do_passo` opcional
- usuaria pode fazer scroll para ver proximos passos sem avancar

### 11.3 Avanco manual com timer ativo

- ao tocar em `proximo passo` com timer rodando, mostrar confirmacao
- se confirmar, o timer e interrompido
- avancar de passo cancela o timer anterior

### 11.4 Retomada

- se o app for para background, a sessao pode ser retomada enquanto o processo do app estiver vivo (sem limite de tempo explicito, so ate o SO encerrar o processo)
- fim do timer deve disparar alerta/notificacao
- se o app for encerrado (processo morto pelo SO ou pela usuaria), nao ha restauracao persistente da sessao guiada no MVP

### 11.5 Finalizacao

Ao concluir todos os passos, mostrar tela de receita finalizada com CTAs:

- avaliar
- favoritar
- compartilhar

Compartilhar gera um deep link publico com slug estavel (ex. `suliv.app/r/bolo-de-cenoura-abc123`), que abre a receita mesmo para quem nao tem conta.

## 12. Favoritos

### 12.1 Regras principais

- receita pode ser favoritada/desfavoritada online ou offline
- favoritos ficam disponiveis offline com conteudo completo da receita
- guided cooking pode rodar a partir de receita favoritada offline

### 12.2 Sincronizacao

- acoes offline entram em fila local
- sincronizacao acontece quando a conexao voltar

### 12.3 Estados

- lista de receitas salvas
- empty state com CTA para explorar receitas

## 13. Perfil e configuracoes

### 13.1 Dados editaveis

- estilo alimentar
- alergias/restricoes
- nivel de cozinha
- frequencia

### 13.2 Dados nao editaveis no MVP

- email

### 13.3 Avatar

- usa foto do login social, se existir
- senao, mostra iniciais

### 13.4 Configuracoes

- termos
- privacidade
- logout
- tema: claro, escuro, automatico

### 13.5 Minhas receitas no perfil

- acesso a receitas enviadas
- lista com status
- status:
  - Rascunho
  - Em analise
  - Aprovada
  - Precisa de ajustes

## 14. Minhas receitas e moderacao

### 14.1 Objetivo

- permitir criacao de receita propria com estrutura consistente
- garantir qualidade via moderacao antes da publicacao

### 14.2 Campos principais da receita

- imagem
- titulo
- descricao
- tempo de preparo
- numero de porcoes
- tipo de porcao (sempre "porcoes"/pessoas - ver 10.2)
- dificuldade (definida pela autora, moderador pode corrigir na revisao)
- ingredientes dinamicos estruturados (unidades padronizadas - ver 10.2)
- passos dinamicos
- informacoes adicionais
- mensagem para o moderador
- aceite dos termos (versionado - ver 5.7)

### 14.3 Regras de formulario

- imagem nao e obrigatoria para `Rascunho`
- imagem e obrigatoria para envio
- rascunho e salvo remotamente
- ingredientes usam unidades padronizadas
- passos podem ter timer por etapa
- sem limite rigido de rascunhos simultaneos no MVP, mas aviso soft acima de 10 rascunhos nao enviados
- imagem passa por resize/compress automatico e checagem automatica de conteudo improprio (ver 19.1) antes da fila de moderacao humana
- rate limit: maximo 5 receitas enviadas por dia por usuaria

### 14.4 Versionamento

- editar receita aprovada substitui a atual no produto
- no banco deve existir versionamento, por exemplo `v2`

### 14.5 Regras de moderacao

- apenas autora e moderador veem receitas nao aprovadas
- moderador atua por painel admin separado (web interno), com tabela de roles propria - nao usa o app de usuaria final
- `Precisa de ajustes` usa categoria + texto livre opcional. Categorias fechadas:
  - Ingrediente ambiguo
  - Passo confuso/incompleto
  - Falta foto
  - Foto de baixa qualidade
  - Tempo/porcao incoerente
  - Conteudo inadequado
  - Outro
- receita aprovada pode voltar para revisao por denuncia
- autora pode excluir receita aprovada
- se houver favoritos/uso, mostrar aviso de impacto antes de excluir
- exclusao e soft delete: a receita ganha status `removida`, some de feed/busca/listas, favoritos de terceiras sao filtrados silenciosamente e deep links antigos caem na tela "receita nao disponivel" (secao 17) - o registro permanece no banco para historico de moderacao e recuperacao em caso de exclusao acidental
- favorito aponta para o "card" logico da receita (sempre mostra a versao mais recente aprovada), nao para uma versao especifica - versionamento (14.4) e historico interno/auditoria
- rate limit de denuncia: maximo 10 por dia por usuaria

### 14.6 Comentarios e avaliacoes

- entram no MVP
- avaliacao: nota obrigatoria de 1 a 5 estrelas + comentario de texto opcional
- 1 avaliacao por usuaria por receita, editavel - avaliar de novo atualiza a existente, nunca cria uma segunda (evita uma unica pessoa inflar/derrubar a media)
- avaliacao nao entra no calculo de score/ranking no MVP (ver 9.3)
- exigem moderacao/denuncia propria, com o mesmo mecanismo de denuncia de receita (ver 14.7)
- rate limit: maximo 20 comentarios/avaliacoes por dia por usuaria

### 14.7 Motivos de denuncia (lista fechada, usada para receita e comentario/avaliacao)

- Conteudo inadequado
- Spam
- Informacao incorreta/perigosa
- Discurso de odio/assedio
- Outro

### 14.8 Boost editorial

- aplicado apenas via painel admin (mesmo do moderador)
- exige data de inicio e fim obrigatorias (sem boost permanente/esquecido)
- fica registrado com autoria e data de aplicacao (log de auditoria)

## 15. Notificacoes

### 15.1 Confirmadas no MVP

- fim de timer
- receita aprovada
- receita precisando de ajustes

### 15.2 Fora do MVP

- notificacoes de engajamento sobre comentarios ou novas receitas

### 15.3 Observacao

- Magic Link existe como email transacional de autenticacao
- canal de push: Firebase Cloud Messaging (FCM) unificado, cobrindo Android e iOS (via APNs por baixo)

## 16. Offline e sincronizacao

### 16.1 Disponivel offline

- favoritos com conteudo completo
- guided cooking de receitas favoritadas
- perfil/preferencias em leitura
- rascunhos de receita em andamento

### 16.2 Nao disponivel offline

- feed
- busca
- descoberta geral

### 16.3 Regras de sincronizacao

- favoritos offline entram em fila
- rascunho de receita pode ser editado offline
- em erro de envio, o conteudo nao pode ser perdido
- conflito entre dispositivos (mesma acao/rascunho editado offline em mais de um aparelho): resolucao last-write-wins por timestamp de origem, tanto para favoritos quanto para rascunho de receita - simplificacao consciente do MVP, ver detalhamento tecnico no data-contract-schema-spec
- rascunho de receita com imagem nao tem limite de tempo para permanecer local, mas exibe aviso soft se ficar mais de 7 dias sem sincronizar

## 17. Estados de erro e empty states

Estados obrigatorios do MVP:

- splash sem conexao
- login sem conexao e sem sessao
- busca sem resultado
- feed sem receitas relevantes
- favoritos vazio
- minhas receitas vazio
- erro de envio para moderacao
- receita nao encontrada ou inativa

Todos os estados devem:

- explicar a situacao em linguagem simples
- sugerir proxima acao
- evitar becos sem saida

## 18. Analytics

### 18.1 Eventos por area

**Auth e onboarding**

- `splash_loaded`
- `login_started`
- `login_success`
- `magic_link_requested`
- `social_login_started`
- `social_login_success`
- `missing_social_data_prompt_viewed`
- `onboarding_started`
- `onboarding_step_completed`
- `preference_base_selected`
- `allergy_added`
- `onboarding_completed`

**Descoberta**

- `feed_viewed`
- `feed_section_viewed`
- `search_used`
- `filter_applied`
- `category_opened`
- `recipe_opened`
- `recipe_warning_viewed`

**Receita e favoritos**

- `serving_adjusted`
- `favorite_saved`
- `favorite_removed`
- `favorites_viewed`
- `favorite_saved_offline`

**Guided cooking**

- `guided_cook_started`
- `guided_step_completed`
- `guided_timer_started`
- `guided_timer_completed`
- `guided_timer_abandoned`
- `guided_cook_finished`
- `guided_cook_abandoned`

**Minhas receitas**

- `submitted_recipe_started`
- `submitted_recipe_completed`

**Perfil**

- `profile_updated`

### 18.1.1 Contexto padrao (todos os eventos)

Todo evento carrega, alem das propriedades especificas listadas abaixo:

- `session_id`
- `platform` (`ios` | `android`)
- `app_version`
- `user_id` (nulo em eventos pre-login, ex. `splash_loaded`)
- `occurred_at` (timestamp de origem no client)

### 18.1.2 Payload por evento

**Auth e onboarding**

| Evento | Propriedades especificas |
| --- | --- |
| `splash_loaded` | `has_active_session: boolean` |
| `login_started` | `method: magic_link \| google \| apple` |
| `login_success` | `method` |
| `magic_link_requested` | `email_domain` (dominio do email, nunca o email completo) |
| `social_login_started` | `provider: google \| apple` |
| `social_login_success` | `provider`, `is_new_account: boolean` |
| `missing_social_data_prompt_viewed` | `missing_fields: string[]` |
| `onboarding_started` | - |
| `onboarding_step_completed` | `step: estilo \| alergias \| nivel_frequencia`, `step_index` |
| `preference_base_selected` | `diet_preference` |
| `allergy_added` | `allergen_id` (nulo se `is_new_term`), `is_new_term: boolean` |
| `onboarding_completed` | `diet_preference`, `cooking_level`, `cooking_frequency`, `allergy_count` |

**Descoberta**

| Evento | Propriedades especificas |
| --- | --- |
| `feed_viewed` | - |
| `feed_section_viewed` | `section: selecionadas \| categorias \| top_semana`, `category_key` (se aplicavel) |
| `search_used` | `query_length`, `has_filters: boolean` |
| `filter_applied` | `filter_type: categoria \| tempo \| dificuldade \| preferencia \| alergia`, `filter_value` |
| `category_opened` | `category_key` |
| `recipe_opened` | `recipe_id`, `origin: feed_selecionadas \| feed_categoria \| feed_top_semana \| busca \| ver_tudo \| deep_link \| favoritos` |
| `recipe_warning_viewed` | `recipe_id`, `allergen_id` |

**Receita e favoritos**

| Evento | Propriedades especificas |
| --- | --- |
| `serving_adjusted` | `recipe_id`, `from_servings`, `to_servings` |
| `favorite_saved` | `recipe_id`, `offline: boolean` |
| `favorite_removed` | `recipe_id` |
| `favorites_viewed` | `count` |
| `favorite_saved_offline` | `recipe_id`, `idempotency_key` |

**Guided cooking**

| Evento | Propriedades especificas |
| --- | --- |
| `guided_cook_started` | `recipe_id` |
| `guided_step_completed` | `recipe_id`, `step_index`, `had_timer: boolean` |
| `guided_timer_started` | `recipe_id`, `step_index`, `duration_seconds` |
| `guided_timer_completed` | `recipe_id`, `step_index` |
| `guided_timer_abandoned` | `recipe_id`, `step_index`, `elapsed_seconds` |
| `guided_cook_finished` | `recipe_id`, `total_duration_seconds` |
| `guided_cook_abandoned` | `recipe_id`, `last_step_index` |

**Minhas receitas**

| Evento | Propriedades especificas |
| --- | --- |
| `submitted_recipe_started` | `recipe_id` (rascunho) |
| `submitted_recipe_completed` | `recipe_id` |

**Perfil**

| Evento | Propriedades especificas |
| --- | --- |
| `profile_updated` | `fields_changed: string[]` |

### 18.2 Uso das metricas

- medir descoberta por origem de abertura
- medir retencao por uso e conclusao do guided cooking
- medir criacao por funil de envio para moderacao

## 19. Dependencias por area

### 19.1 Backend

- auth e sessao
- perfil e username unico
- catalogo de receitas e ingredientes
- ranking e filtros
- moderacao de receitas e comentarios
- sincronizacao offline
- analytics

### 19.2 Design

- onboarding
- feed, busca e filtros
- detalhe de receita
- guided cooking
- minhas receitas
- estados de erro
- configuracoes

### 19.3 Mobile/frontend

- navegacao e roteamento
- modo offline
- timers e notificacoes
- formulários dinamicos
- listas com scroll infinito

### 19.4 Produto

- calibracao de score
- criterios editoriais
- regras de moderacao
- prioridades de analytics

## 19.5 Decisoes tecnicas e nao-funcionais

### 19.5.1 Busca

- campos considerados: titulo, categoria, ingredientes principais
- tecnologia: full-text search nativo do Postgres no MVP (troca por motor dedicado, ex. Meilisearch/Elasticsearch, e uma evolucao futura sem mudar o contrato de API)

### 19.5.2 Paginacao

- todas as listas com scroll infinito (feed, busca, ver tudo) usam paginacao cursor-based, nao offset-based

### 19.5.3 Armazenamento de imagem

- provedor tipo Cloudinary (ou equivalente) com resize/compress automatico
- moderacao automatica de conteudo improprio via API do provedor, antes da fila de moderacao humana

### 19.5.4 Internacionalizacao

- MVP e somente pt-BR
- strings organizadas em arquivo de traducao (i18n-ready) desde o inicio, sem tradução real de outro idioma no MVP

### 19.5.5 Acessibilidade

- nivel basico obrigatorio no MVP: contraste adequado, areas de toque minimas, labels para screen reader nos componentes principais do design system

### 19.5.6 Ambientes e feature flags

- 3 ambientes: dev, staging, prod
- feature flags simples desde o inicio, para rollout gradual de mudancas de ranking/onboarding

### 19.5.7 SLA de performance

- meta de p95 < 500ms para listagem/feed
- sem SLA formal para busca full-text no MVP (calibrar com dado real de uso)

### 19.5.8 Rate limiting (consolidado)

- envio de receita: maximo 5/dia por usuaria
- comentarios/avaliacoes: maximo 20/dia por usuaria
- denuncias: maximo 10/dia por usuaria

## 20. Criterios de aceite do MVP

O MVP pode ser considerado pronto para lancamento interno quando:

- usuaria consegue autenticar por Magic Link, Google ou Apple
- onboarding obrigatorio funciona de ponta a ponta
- feed carrega as tres secoes principais
- busca, filtros e `ver tudo` funcionam com scroll infinito
- receita detalhe exibe alertas, porcoes e favoritos
- preparo guiado funciona com timer por passo e finalizacao
- favoritos funcionam offline
- perfil permite editar preferencias
- usuaria consegue criar, salvar rascunho, enviar e acompanhar receita propria
- moderador consegue aprovar ou devolver receita para ajuste

## 21. Fora do escopo

- restauracao de sessao de guided cooking apos matar o app
- sugestoes automaticas de username
- upload manual de avatar
- notificacoes de engajamento
- receitas relacionadas
