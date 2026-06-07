# ⚠️ Ce Dockerfile suppose que @replang-app/db et @replang-app/shared sont PUBLIÉS
# sur GitHub Packages (les deps `file:` du dev local ne sont pas accessibles
# dans le contexte de build isolé). À activer quand la CI de publication sera
# en place ; fournir NPM_TOKEN en secret de build.

# ─── Étape build ──────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Auth au registre privé pour installer les packages @replang-app/*
COPY .npmrc.example .npmrc
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Étape runtime ────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY .npmrc.example .npmrc
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}

COPY package.json ./
RUN npm install --omit=dev && rm -f .npmrc

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]
