# Roteiro de teste regressivo — `fix/onboarding-navigation-and-mmkv`

> Varredura das mudanças da branch `fix/onboarding-navigation-and-mmkv` e checklist de regressão
> manual. Gerado em 2026-09-13; atualizado em 2026-09-13 com a revisão automatizada e com a
> execução no app (simulador iOS e web).

## O que foi implementado

1. **MMKV v3** — upgrade de `react-native-mmkv` 2.12→3.3 para suportar a New Architecture
   ([app/package.json](../app/package.json)).
2. **Guarda de rota por sessão viva** — [`_layout.tsx`](../app/src/app/_layout.tsx) resolve o
   grupo ativo (`(auth)` / `(onboarding)` / `(tabs)`) a partir do `sessionStatus` + `user` a cada
   render, não só na splash. Onboarding completo grava `onboardingCompletedAt` na session store
   ([use-onboarding-view-model.ts](../app/src/module/onboarding/viewModels/use-onboarding-view-model.ts))
   para que essa guarda funcione. Depois de um logout, uma sessão sem perfil carregado fica em
   `(auth)` em vez de reaproveitar a rota calculada pela splash (correção `f822534`).
3. **Onboarding scroll** — o corpo de cada step vive num `ScrollView` próprio (header/footer
   fixos); `complete-profile.tsx` teve o conteúdo realinhado ao topo.
4. **Auth storage cross-platform** — [`auth-service.ts`](../app/src/module/auth/services/auth-service.ts)
   troca `SecureStore` puro por um adapter que cai para `localStorage` no
   `Platform.OS === 'web'`.
5. **Listing / "ver tudo"** — botão de voltar visível quando a tela é empilhada (`onBack`), com
   fallback para o feed se não houver histórico (deep link); grid corrigido para não estourar a
   largura da célula; gutter unificado via `layout.screenGutter` em vários componentes.
6. **Recipe detail** — extraído para `RecipeDetailContent`; badge vegano no título,
   parallax/zoom no cover ao dar overscroll, pill de dieta e de porções removidos do hero, texto
   "Sem avaliações"→"Novo", ajustes finos de espaçamento (stepper, section-header).
7. **Infra local** — portas do Supabase local deslocadas (54321→54421 etc.) e
   `site_url`/`redirect_urls` trocados para o esquema `suliv://` (deep link), com nota no
   `AGENTS.md` sobre não rodar `prisma migrate dev` contra o banco hospedado.

Cobertura automatizada em `_layout.test.tsx`, `ver-tudo.test.tsx`, `listing-screen.test.tsx`,
`use-onboarding-view-model.test.ts` e `auth-service.test.ts` — rode a suíte antes do manual:

```bash
cd app && npm test
```

## Resultado da execução — 2026-09-13

### Ambiente usado no teste manual

| Peça | Configuração |
|---|---|
| App iOS | Build limpo Debug (`suliv.xcworkspace`), iPhone 17 Pro, iOS 26.0 (simulador) |
| App web | `expo start` servindo `localhost:8081` |
| API | `npm run start:test` com `api/.env.local` exportado (Supabase local `54421`) |
| Banco | Postgres Docker isolado `localhost:54329/suliv_test` (156 receitas, 43 alergênicos) |
| Auth | Supabase local em 544xx; magic links capturados no Mailpit (`54424`) |
| Usuários de teste | `regressao.ios@suliv.test` (criado, onboarded e excluído); `regressao.web@suliv.test` |

### Verificações automatizadas

| Verificação | Resultado |
|---|---|
| `npm test` (app) | 62 suítes, 350 testes — todos passando |
| `npx jest` (api) | 30 suítes, 246 testes — todos passando |
| `npm run typecheck` (app) | sem erros |
| `npm run lint` (app) | 0 erros; 4 avisos já existentes antes da branch |
| Pre-push (`api`) | 29 suítes, 244 testes — todos passando |
| Build iOS limpo | sucesso em ~17 min; 0 erros, 727 avisos de dependências (APIs obsoletas) |

### Problemas encontrados e corrigidos

| Commit | Item do roteiro | Problema | Correção |
|---|---|---|---|
| `f822534` | 1.3, 1.5 | App aberto já logado → logout → login de novo: a sessão ficava `authenticated` antes do perfil carregar e o guard voltava para o `(tabs)` da splash, desmontando o login no meio do bootstrap. | Após um logout, sessão sem perfil fica em `(auth)`. Teste em `_layout.test.tsx`; **confirmado no simulador**. |
| `1d2b939` | 3.2 | Adapter de storage web sem cobertura de teste. | Teste em `auth-service.test.ts`; **confirmado no web** (sessão gravada em `localStorage`). |
| `8dbf60f` | 6.3 | Prop `servings` continuava declarado e passado ao hero depois da remoção do pill. | Prop removido; formatação de `spacing.xl - 4` corrigida. |
| `316e266` | 8.1 | `api/.env.local.example` apontava `SUPABASE_URL` para `54321`, ocupada por outro projeto Supabase local. | Atualizado para `54421`. |
| `fix(listing)` | 5.2 | **Deep link direto para "Ver tudo": o botão de voltar não fazia nada.** Sem histórico, `canGoBack()` é `false` e o fallback chamava `router.replace('/')`. Só que `/` também resolve para `(onboarding)/index`, escondido pelo `Stack.Protected` para quem já fez onboarding — a navegação era descartada em silêncio. O teste automatizado passava porque mocka o router. | Fallback passa a nomear o grupo: `router.replace('/(tabs)')` em [`ver-tudo.tsx`](../app/src/app/ver-tudo.tsx); teste atualizado. **Confirmado no simulador.** |

### Achados fora do escopo da branch — corrigidos e testados

| Commit | Achado | Correção | Verificação |
|---|---|---|---|
| `feat(api)` | **Web não carregava o perfil:** a API não habilitava CORS (`OPTIONS /me/bootstrap` → 404, "Failed to fetch"). | CORS opcional via `CORS_ORIGINS` ([`cors.ts`](../api/src/config/cors.ts)). Sem a variável, o CORS continua desligado, como antes. O admin não precisa, porque chama a API pelo servidor do Next. | `cors.spec.ts`; no web, preflights 204, `POST /me/bootstrap` 201, `PATCH /me` 200 e `POST /me/onboarding` 201. |
| `chore(supabase)` | **Magic link no web** sempre redirecionava para `suliv://login`, que o navegador não abre. | `http://localhost:8081/*` em `additional_redirect_urls`. | Supabase local reiniciado; e-mail com `redirect_to=http://localhost:8081/login`; link abriu o app web logado no complete-profile. |
| `fix(auth)` | **Mensagens em inglês** no fluxo de auth e perfil. | Textos em português centralizados em [`messages.ts`](../app/src/module/auth/messages.ts). | Testes dos view models; "Informe seu nome." no web e "Informe um e-mail válido." no iOS. |
| `fix(auth)` | **Outros `router.replace('/')`** tinham a mesma ambiguidade de rota do item 5.2. | [`resolveHomeRoute`](../app/src/module/auth/navigation.ts) nomeia `/(onboarding)` ou `/(tabs)` conforme o perfil; `steps.tsx` usa `/(tabs)`. | `navigation.test.ts` e testes dos view models; complete-profile → onboarding no web e no iOS; onboarding concluído → feed no web. |

Ainda em aberto: mensagens vindas da própria API ou do Supabase (`caught.message`) continuam
sendo exibidas como chegam, possivelmente em inglês.

### Legenda do checklist

- `[x]` verificado — o método está indicado em itálico.
- `[ ]` pendente — com a razão indicada em itálico.

## Roteiro de teste regressivo

### 1. Sessão e navegação inicial (`_layout.tsx`)
- [x] Usuário **sem conta** abre o app → cai em `(auth)`.
      *Teste automatizado IT-002; web e iOS abriram no login sem sessão.*
- [x] Login/cadastro sem nome definido → permanece em `(auth)` na tela `complete-profile` (não
      pula pra onboarding/tabs).
      *Simulador: magic link de usuário novo, na mesma execução em que a splash havia resolvido
      `(tabs)`, abriu o complete-profile — valida também a correção `f822534`.*
- [x] Preenche nome → avança; se `onboardingCompletedAt` ainda nulo → vai para `(onboarding)`; se
      já preenchido → vai direto para `(tabs)`.
      *Simulador: nome salvo levou à tela de boas-vindas do onboarding; testes automatizados
      cobrem o caso já onboarded.*
- [x] Usuário **já onboarded** reabre o app → cai direto em `(tabs)`, sem passar por onboarding.
      *Simulador: duas reaberturas com sessão persistida caíram no feed.*
- [x] **Logout** em qualquer tela → força volta imediata para `(auth)` (o guard reage à mudança
      de `sessionStatus`, não só na abertura do app).
      *Simulador: "Sair" na aba Você levou direto ao login, sem erros no Metro.*
- [x] **Exclusão de conta** → mesmo comportamento do logout.
      *Simulador: confirmação levou direto ao login; usuário anonimizado no banco
      (`status = anonymized`).*

### 2. Onboarding
- [x] Nos 3 steps, com muitas opções (ex.: lista de alergias longa), o **corpo rola**
      independente e o footer/CTA continua visível e fixo.
      *Simulador: lista de 42 alergênicos rolou com barra de progresso e footer fixos.*
- [ ] Teclado aberto no step de alergias (campo de novo termo) não esconde o botão de avançar
      (`keyboardShouldPersistTaps`).
      *Parcial: busca filtrou e a seleção funcionou com o campo focado, mas o simulador usava o
      teclado físico do Mac — o teclado virtual não apareceu. Repetir em aparelho.*
- [x] Tela `complete-profile`: conteúdo alinhado ao topo (não mais centralizado), input e
      mensagem de erro visíveis sem rolar.
      *Simulador: conteúdo no topo, CTA no rodapé, erro exibido logo abaixo do campo.*
- [x] Ao concluir o último step: `onboarding_completed` é disparado, snapshot salvo em cache
      offline, e o app navega para `(tabs)` **sem precisar reabrir o app** (valida a escrita em
      `useSessionStore`).
      *Simulador: evento no log, feed aberto em seguida, `profile-snapshot` do usuário novo
      presente no arquivo MMKV, perfil e alergia gravados no banco.*
- [x] Fechar e reabrir o app logo após concluir o onboarding → continua em `(tabs)`
      (persistência).
      *Simulador: `terminate` + `launch` caiu no feed.*

### 3. Autenticação / storage
- [ ] **iOS/Android**: login, fechar app, reabrir → sessão persiste (via SecureStore,
      comportamento antigo preservado).
      *iOS verificado no simulador (sessão persistiu em duas reaberturas). Android pendente — não há
      pasta `android/`; gerar exige prebuild, adiado por decisão.*
- [x] **Web** (se aplicável ao target): login → sessão persiste via `localStorage`; logout limpa
      a chave (`authStorageAdapter.removeItem`).
      *Web: magic link com retorno para `localhost:8081` gravou a sessão em `suliv.auth.session`
      e o perfil carregou pela API com CORS. Limpeza no logout coberta por teste automatizado.*
- [x] Logout em qualquer plataforma não deixa resíduo de sessão (tentar reabrir o app depois —
      deve cair em `(auth)`).
      *Simulador: após excluir a conta, reabrir o app caiu no login.*
- [x] Deep link de login (`suliv://login`) e magic link continuam funcionando com o novo
      `site_url`/`additional_redirect_urls` do Supabase local.
      *Simulador: magic link do Mailpit → Safari → "Abrir no suliv" → sessão criada no app.
      `GOTRUE_SITE_URL` e `GOTRUE_URI_ALLOW_LIST` do container conferem com o `config.toml`.*

### 4. MMKV / New Architecture
- [ ] Build limpo (iOS e Android) após o upgrade para v3 — checar que o app **não crasha na
      abertura** (erro clássico de MMKV v3 é incompatibilidade com Old Architecture; confirmar
      que o projeto está mesmo em New Arch).
      *iOS verificado: build limpo sem erros, app abriu sem crash, log nativo
      `[RNMMKV]: Creating MMKV instance "mmkv.default"`. Android pendente.*
- [x] Qualquer dado que passe por MMKV (cache/onboarding snapshot, etc.) lê e escreve
      corretamente após o upgrade.
      *Simulador: snapshot do perfil do usuário novo gravado no `mmkv.default` ao concluir o
      onboarding; sem "Failed to initialize MMKV storage" no log.*
- [ ] Testar em dispositivo físico, não só simulador, já que engines nativas mudam.
      *Pendente — sem aparelho nesta execução.*

### 5. Listagem / "Ver tudo"
- [x] Entrar em "Ver tudo" a partir de uma categoria (tela empilhada) → **botão de voltar
      visível** no topo, funciona.
      *Simulador: seta visível, retorno ao feed.*
- [x] Abrir "Ver tudo" via **deep link direto** (sem tela anterior no stack) → botão de voltar
      não trava; cai no feed (`/`) em vez de ficar preso.
      *Falhava no simulador (seta sem efeito); corrigido nomeando o grupo `/(tabs)` e
      confirmado com `suliv://ver-tudo?origin=categoria&categoryKey=lanche` a frio.*
- [x] Aba de busca (tab raiz) → **não** mostra botão de voltar, mantém o título rolável como
      antes.
      *Simulador: título "Busca", sem seta.*
- [x] Grid de receitas: cards com título longo **não estouram** a largura da coluna; card único
      numa última linha ímpar ocupa só metade da largura (não full-bleed).
      *Simulador: títulos longos truncados com "…"; busca com resultado único ocupou meia
      largura.*
- [x] Gutter da lista, do header e do empty state estão visualmente alinhados com os cards (sem
      duplicar padding).
      *Simulador: busca, chips e cards alinhados na mesma margem. Empty state não exercitado.*
- [x] Filtros e busca continuam funcionando dentro da nova estrutura de header.
      *Simulador: filtro "Lanche" + busca "Wrap" retornaram só o Wrap de grão-de-bico.*

### 6. Detalhe da receita
- [x] Receita com `dietPreference: 'vegano'` mostra o **selo vegano** ao lado do título; outras
      dietas não mostram selo.
      *Simulador: selo no Wrap de grão-de-bico; ausente no Sanduíche natural de frango e no
      Pudim de leite condensado.*
- [x] Rolar a tela: a imagem de capa faz **parallax** (desloca mais devagar); puxar para baixo
      (overscroll) dá **zoom** na capa sem revestir o fundo arredondado do corpo.
      *Testado manualmente pela autora da branch.*
- [x] Confirmar que os pills removidos (dieta e "X porções") **não aparecem mais** no hero, e o
      texto de avaliação mostra "Novo" quando não há reviews (em vez de "Sem avaliações").
      *Simulador: hero com tempo, dificuldade e "Novo" nas três receitas abertas.*
- [x] Stepper de porções: tamanho/gap novo não corta o texto nem desalinha com o cabeçalho
      "ingredientes".
      *Simulador: alinhado ao "INGREDIENTES"; 1→2 porções escalou as quantidades.*
- [x] Sem warning do Reanimated sobre `useAnimatedRef` não anexado nas telas de loading/not-found
      (tela de "receita não encontrada" e loading não devem montar `RecipeDetailContent`).
      *Revisão de código: a tela retorna antes de montar o conteúdo nesses casos.*
- [x] Comentários, alerta de alergia e CTA "Começar a cozinhar" seguem funcionando após a
      extração para `RecipeDetailContent`.
      *Simulador: seção de avaliações renderizada; alerta "Contém Leite" para usuário com essa
      alergia; CTA abriu o modo cozinhar.*

### 7. Design system / regressão visual geral
- [x] Telas que tiveram `spacing.lg - 4` trocado por `layout.screenGutter` (section-header,
      settings-header, filter-bar, category-row, recipe-carousel, top-of-week-list, greeting) —
      conferir visualmente que o espaçamento lateral não mudou perceptivelmente.
      *Simulador: feed, listagem e aba Você com a mesma margem lateral nos títulos, chips e cards.*
- [x] `section-header`: pequeno `marginTop` novo não desalinha com o conteúdo acima.
      *Simulador: seções "Selecionadas", "Categorias" e "Top da semana" sem salto visual.*

### 8. Infra local (dev apenas, não afeta produção)
- [x] `supabase start` local sobe sem conflito de porta (novo bloco 544xx).
      *Containers `supabase_*_api` no ar em 544xx junto com outro projeto em 543xx;
      `EXPO_PUBLIC_SUPABASE_URL` do app aponta para `54421`; exemplo da `api` corrigido em `316e266`.*
- [ ] Time confirma que ninguém está usando `npm run prisma:migrate` direto contra o Supabase
      hospedado (ler nota nova no `AGENTS.md`).
      *Pendente — depende do time.*

## Observações

- [`recipe-detail-content.tsx`](../app/src/components/organisms/recipe-detail-content.tsx) tem
  184 linhas, acima do limite de 150 da regra do projeto (já vinha do commit `bc2be03`).
- Para reproduzir o ambiente local, [`.claude/launch.json`](../.claude/launch.json) ganhou as
  configurações `suliv-metro` e `suliv-api-local` (esta já exporta `CORS_ORIGINS`). Quem usa
  `api/.env.local` próprio deve acrescentar `CORS_ORIGINS="http://localhost:8081"`, como no
  exemplo.
- Ainda sem commit (alterações anteriores, fora desta revisão): `AGENTS.md`,
  `section-header.tsx`, `servings-stepper.tsx`, `.vscode/` e `README.md`.
