# Banco local isolado para testes

Os testes usam somente o serviço `postgres` de `docker-compose.test.yml`. Ele
expõe `localhost:54329`, usa o banco `suliv_test` e mantém seus dados no volume
Docker `suliv-local-test_suliv_postgres_test_data`. Essa combinação é aceita
explicitamente pelos scripts; qualquer URL remota, outra porta ou outro banco é
recusado antes de uma operação Prisma ou de escrita do E2E.

Docker Compose foi escolhido porque o repositório já usa PostgreSQL via Prisma,
mas não versiona uma pilha Supabase local completa. O diretório `api/supabase`
está vinculado a um projeto e não é usado aqui para evitar o risco de comandos
Supabase alcançarem o ambiente remoto.

## Preparação

Instale as dependências de `api/` e `admin/`, se ainda não estiverem instaladas.
Depois crie os arquivos locais, que são ignorados pelo Git:

```bash
cp api/.env.test.example api/.env.test.local
cp api/.env.local.example api/.env.local
cp admin/.env.test.example admin/.env.test.local
docker compose -f docker-compose.test.yml up -d
```

Os exemplos não contêm segredos. Não copie valores do `.env` remoto para esses
arquivos.

## Prisma e testes de integração

Todos estes comandos carregam `api/.env.test.local`, exigem
`localhost:54329/suliv_test` e substituem um eventual `DATABASE_URL` herdado do
shell ou de `api/.env`.

```bash
cd api
npm run db:migrate:test  # aplica migrations sem resetar o banco
npm run db:seed:test     # executa o seed quando fixtures são necessárias
npm run test:integration # valida a URL, reseta SOMENTE suliv_test, migra, semeia e roda Jest
```

`test:integration` é deliberadamente destrutivo apenas para o volume local de
teste. O script para antes de chamar `prisma migrate reset` se a URL não for a
URL local esperada.

## API e E2E do painel

Em um terminal, após aplicar as migrations:

```bash
cd api
npm run start:test
```

Esse comando carrega `api/.env.test.local`; não use `api/.env.local` para a
API consumida pela suíte E2E.

Os dois arquivos `.env.test.local` devem compartilhar o valor local versionado
nos exemplos de `ADMIN_JWT_SECRET`, para que o proxy do painel valide o token
emitido pela API de teste.

Em outro terminal, com a API pronta em `http://localhost:3000`:

```bash
cd admin
npm run test:e2e
```

O E2E exige explicitamente a mesma URL de banco local e uma `ADMIN_API_URL`
local em `localhost:3000`; o setup do Playwright não possui mais fallback para
um banco padrão.

## Encerrar ou remover os dados locais

Para parar preservando os dados locais:

```bash
docker compose -f docker-compose.test.yml stop
```

Para remover somente o container e o volume deste Compose isolado:

```bash
docker compose -f docker-compose.test.yml down -v
```

Esse comando não chama Supabase e não alcança bancos remotos.
