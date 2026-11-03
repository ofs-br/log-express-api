# Deploy — Coolify + Neon

Guia de produção da API no servidor Ubuntu com Coolify (Traefik) e banco PostgreSQL no Neon.

## Arquitetura

```
GitHub (push na main)
   │ webhook
   ▼
Coolify (VPS) → Traefik → https://logexpress.ofs.dev.br
                    │
                    ▼
             API Node 22 (porta 3333 interna)
                    │ SSL + pooled
                    ▼
             Neon Postgres 16 (São Paulo)
```

## 1. Banco no Neon

1. Criar conta em <https://neon.com>.
2. **New Project**:
   - Nome: `log-express-api`
   - Região: **AWS South America (São Paulo) — `aws-sa-east-1`**
   - PostgreSQL: **16**
3. Em **Connect**, copiar as duas URLs:
   - **Pooled connection** (host com `-pooler`) → `DATABASE_URL`
   - **Direct connection** (host sem `-pooler`) → `DATABASE_URL_UNPOOLED`

Formato:

```env
DATABASE_URL=postgresql://USER:PASS@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=5
DATABASE_URL_UNPOOLED=postgresql://USER:PASS@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

> Se o Prisma reclamar de `channel_binding=require`, remova esse parâmetro.

## 2. DNS no Cloudflare

```
Tipo: A
Nome: logexpress
Conteúdo: <IP público da VPS>
Proxy: DNS only (nuvem cinza)
TTL: Auto
```

Para obter o IP público, no servidor:

```bash
curl -4 -s https://ifconfig.me
```

Validar:

```bash
dig +short logexpress.ofs.dev.br @1.1.1.1
```

## 3. Aplicação no Coolify

Em **Project → Environment → + New → Application**:

| Campo | Valor |
|---|---|
| Repository | `https://github.com/ofs-br/log-express-api` |
| Branch | `main` |
| Build pack | `Dockerfile` |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` |
| Ports Exposes | `3333` |
| Domain | `https://logexpress.ofs.dev.br` |
| Health check path | `/health` |
| Health check port | `3333` |
| Health check return code | `200` |

**Environment Variables** (aba *Environment Variables*):

```env
NODE_ENV=production
PORT=3333
DATABASE_URL=<pooled do Neon>
DATABASE_URL_UNPOOLED=<direct do Neon>
JWT_SECRET=<openssl rand -base64 48>
CORS_ORIGIN=*
```

Não criar Postgres no Coolify: o banco fica no Neon.

Depois: **Deploy**.

## 4. Auto-deploy pelo GitHub

1. No Coolify: **Webhooks** → copiar a **Deploy Webhook URL**.
2. No GitHub: **Settings → Webhooks → Add webhook**:
   - Payload URL: URL do Coolify
   - Content type: `application/json`
   - Event: **Just the push event**
3. Push na `main` passa a disparar deploy automático.

## 5. Validação

```bash
curl -i https://logexpress.ofs.dev.br/health
# {"status":"ok","uptime":...,"timestamp":"..."}

curl -i -X OPTIONS https://logexpress.ofs.dev.br/sessions \
  -H "Origin: https://exemplo.com" \
  -H "Access-Control-Request-Method: POST"

curl -i https://logexpress.ofs.dev.br/users
```

Nos logs do Coolify, confirmar que `prisma migrate deploy` foi executado com sucesso.

Fluxo funcional:

```bash
curl -X POST https://logexpress.ofs.dev.br/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"password123"}'

curl -X POST https://logexpress.ofs.dev.br/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"password123"}'
```

## 6. Cloudflare (opcional)

Depois que o certificado do Traefik estiver emitido:

1. Ativar o proxy (nuvem laranja) no registro `A`.
2. Em **SSL/TLS → Overview**, selecionar **Full (strict)**.
3. Opcional: **Always Use HTTPS**.

## 7. Operação

- **Logs**: painel do Coolify → *Logs*.
- **Restart**: *Restart* no painel.
- **Migrations**: automáticas a cada start (`docker-entrypoint.sh`) com até 10 tentativas.
- **Backup**: Neon Free tem restore de 6h + 1 snapshot. Para algo mais robusto, agendar `pg_dump` externo.
- **Uso do Neon**: acompanhar *Project → Usage* (100 CU-hours/mês no free).

## 8. Desenvolvimento local

```bash
npm install
cp .env-example .env   # preencher DATABASE_URL e JWT_SECRET
docker compose up -d    # Postgres local
npm run dev
```

> `DATABASE_URL_UNPOOLED` é opcional localmente; use a mesma URL direta do Postgres quando precisar rodar `prisma migrate`.
