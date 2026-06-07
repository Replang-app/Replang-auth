# Replang — Auth Service

Service d'authentification de Replang. Construit avec **Fastify** + **Better-Auth**,
expose les routes d'auth et un endpoint **JWKS** pour que les autres services
vérifient les JWT.

- Port : `3001`
- Routes : `GET /health`, `ALL /api/auth/*` (gérées par Better-Auth)
- Endpoint clé : `GET /api/auth/jwks` (clé publique de vérification des JWT)

## Stack & dépendances partagées

- `@replang-app/db` — client Prisma + schéma (tables `users`, `sessions`, `accounts`, `verifications`, `jwks`).
- `@replang-app/shared` — `loadEnv` (config Zod).

> En dev local, ces deux packages sont liés en `file:` vers `../Replang-infra`.
> Le repo `Replang-infra` doit donc être cloné à côté, et ses packages buildés
> (`npm install && npm run build` dans `Replang-infra`).

## Démarrage (dev local)

```bash
# Pré-requis : Postgres lancé + migrations appliquées depuis Replang-infra
#   (cd ../Replang-infra && docker compose up -d postgres && npm run db:migrate)

cp .env.example .env          # adapter BETTER_AUTH_SECRET notamment
npm install
npm run dev                   # http://localhost:3001
```

## Vérifs rapides

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/auth/jwks
# Inscription
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.c","password":"motdepasse123","name":"Test"}'
```

## Authentification dans les autres services

Les services vérifient les JWT sans appeler ce service, via `@replang-app/shared` :

```ts
import { createAuthVerifier } from "@replang-app/shared";
const requireAuth = createAuthVerifier({
  jwksUrl: "http://auth:3001/api/auth/jwks",
});
// app.addHook("preHandler", requireAuth) sur les routes protégées
```
