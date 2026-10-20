# Checklist de release: contrato de erros e mensagens em pt-BR

Cobre o que entrou em `main` pelos PRs #2, #3 e #4: contrato de erro da API (códigos estáveis), cliente HTTP
e registro de mensagens do app, painel admin com códigos, tela de username e mensagem de favorito offline,
além do hardening do import de receitas.

Marque cada item ao concluir. Os itens de verificação marcados com **(não executado)** nunca rodaram em
dispositivo ou ambiente real durante o desenvolvimento.

## 1. Antes de publicar

### Verificação que falta

- [ ] **(não executado)** Maestro em dispositivo, com a API local e o Supabase local no ar (ver `app/.maestro/README.md`):
  - [ ] `recipe-not-found-state-view.yaml`: receita inexistente mostra a cópia pt-BR e o botão volta ao feed.
  - [ ] `login-expired-magic-link.yaml`: link expirado mostra "Esse link expirou. Peça um novo link mágico." e some ao enviar outro.
  - [ ] `session-revoked-returns-to-login.yaml`: exige `REVOKED_ACCESS_TOKEN`, `REVOKED_REFRESH_TOKEN`, `REVOKED_USER_ID`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; usuário apagado volta ao login com "Sua sessão expirou. Entre novamente.".
  - [ ] `favorite-offline-uncached-shows-connection-message.yaml`: exige `setAirplaneMode` (Android) e o seed rodado.
  - [ ] `settings-username-taken.yaml`: exige um usuário seed dono do username `existing_user`; o usuário `PERSISTED_*` não pode estar na janela de 30 dias.
- [ ] **(instável)** Playwright do admin com a porta 3000 livre: `cd admin && npm run test:e2e`. Em desenvolvimento só ficou estável com `--workers=1`; confirme se a instabilidade com workers paralelos se repete.
- [ ] Teste manual rápido no app: abrir um link magic expirado, trocar o username (sucesso e erro de nome em uso) e favoritar offline uma receita nunca aberta.
- [ ] Teste manual rápido no admin: login com e-mail inválido (mensagens por campo em pt-BR), senha errada e termo de alérgeno duplicado.

### Pré-requisitos de ambiente

- [ ] CI verde em `main` (jobs `api`, `app` e `error-codes`). O job do admin não existe na CI: rode `cd admin && npm test && npm run lint && npx next build` localmente.
- [ ] `packages/error-codes/dist` está em sincronia com o fonte (a CI confere). Não altere o catálogo sem reconstruir o pacote.
- [ ] Migrations do banco hospedado revisadas. Aplique com `prisma migrate deploy`; **nunca** `prisma migrate dev` no banco hospedado (ver `README.md` do monorepo). Inclui as migrations do import de receitas, por exemplo `canonical_name` do ingrediente.
- [ ] Seed do catálogo de alérgenos aplicado, se o ambiente ainda não o tiver.
- [ ] Variáveis de ambiente conferidas para o ambiente de destino (API, admin e app). O `ADMIN_JWT_SECRET` da API e do admin precisa ser o mesmo.

## 2. Ordem do deploy

1. [ ] **Migrations** no banco hospedado.
2. [ ] **API e admin juntos.** O painel antigo lê `message` do corpo de erro, e a API nova não envia mais nesse formato. Publicar só um dos lados degrada o outro: com a API nova e o painel antigo, os erros aparecem genéricos; com a API antiga e o painel novo, não há `code` para traduzir (o painel cai na cópia genérica).
3. [ ] **App** depois da API. Versões antigas do app continuam funcionando, mas passam a mostrar a mensagem genérica "Algo deu errado" no lugar do erro específico, porque o corpo de erro mudou. Aceite isso antes de liberar na loja.

## 3. Logs, monitoramento e pontos de atenção

- [ ] O coletor de logs aceita as linhas estruturadas novas: cada `5xx` (nível `error`, com stack) e cada `429` (nível `warn`), com `code`, `statusCode`, `method`, `route` e `userId`. Erros `4xx` tratados não são logados.
- [ ] Alerta ou painel para a taxa de `INTERNAL_ERROR` por rota.
- [ ] Alerta para picos de `AUTH_SESSION_EXPIRED` logo após o deploy: um pico aponta problema de JWKS ou de chave, porque um `401` com token encerra a sessão central.
- [ ] O evento `error_unmapped` hoje só aparece no console, porque o `analyticsClient` ainda não tem backend. Até existir um, códigos sem tradução não são vistos em produção.
- [ ] Endpoints que respondem `401` por motivo de permissão deslogam o usuário. Permissão negada precisa responder `403`; confira se nenhum endpoint novo viola isso.

## 4. Depois do release

- [ ] Observe `INTERNAL_ERROR`, `AUTH_SESSION_EXPIRED` e o volume de `429` por pelo menos um dia.
- [ ] Revise reclamações de erro "genérico" vindas de versões antigas do app.
- [ ] Quando houver backend de analytics, passe a acompanhar `error_unmapped` e traduza cada código novo.

## 5. Lacunas conhecidas e rollback

- O `DraftIngredientDto.name` só valida `@IsString()`; o nome vazio de ingrediente não retorna `isNotEmpty`. Mudar isso altera o comportamento de rascunhos com linha em branco e fica para um ajuste separado.
- O E2E de "favorito offline" só cobre receitas sem detalhe em cache; receitas em cache seguem favoritando em silêncio (decisão de produto, mantém o local-first).
- **Rollback:** a mudança de contrato é no corpo de erro, sem alteração de status HTTP nem de schema. Voltar API e admin para a versão anterior restaura o comportamento antigo; o app novo, com a API antiga, mostra mensagens genéricas até a API voltar a enviar `code`. As migrations do import de receitas são aditivas; não desfaça sem avaliação.
