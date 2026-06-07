import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { prisma } from "@replang-app/db";
import { Redis } from "ioredis";
import { env } from "./env.js";

// Connexion Redis optionnelle : utilisée comme secondaryStorage si REDIS_URL est défini.
// Permet au rate-limit et au cache de sessions d'être distribués (multi-instance).
// Sans Redis, Better-Auth repasse silencieusement en stockage mémoire (une instance).
let redisClient: InstanceType<typeof Redis> | undefined;

if (env.REDIS_URL) {
  redisClient = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  redisClient.on("error", (err: Error) => {
    console.error("[Redis] erreur de connexion :", err.message);
  });
}

const secondaryStorage = redisClient
  ? {
      get: async (key: string) => {
        try { return await redisClient!.get(key); }
        catch { return null; }
      },
      set: async (key: string, value: string, ttl?: number) => {
        try {
          if (ttl) await redisClient!.set(key, value, "EX", ttl);
          else await redisClient!.set(key, value);
        } catch { /* silencieux : taux-limite dégradé si Redis indisponible */ }
      },
      delete: async (key: string) => {
        try { await redisClient!.del(key); }
        catch { /* silencieux */ }
      },
    }
  : undefined;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()),
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Durées de session rendues explicites
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours (en secondes)
    updateAge: 60 * 60 * 24,      // renouvellement si activité dans la dernière journée
  },

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      displayName: { type: "string", required: false },
    },
  },

  // Protection brute-force sur toutes les routes /api/auth/*.
  rateLimit: {
    enabled: true,
    window: 60,  // fenêtre de 60 secondes
    max: 100,    // 100 requêtes max par fenêtre et par IP
    ...(secondaryStorage ? { storage: "secondary-storage" as const } : {}),
  },

  advanced: {
    // Cookies Secure uniquement en prod (HTTPS). En dev (HTTP), le navigateur
    // refuserait de stocker un cookie Secure → sessions cassées.
    useSecureCookies: env.NODE_ENV === "production",
    // Lire la vraie IP cliente depuis X-Forwarded-For (posé par le proxy/Docker).
    // Sans ça, le rate-limit clé sur l'IP du proxy → partagée par tous les users.
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },

  ...(secondaryStorage ? { secondaryStorage } : {}),

  plugins: [
    jwt({
      // JWT courte durée : 15 min. Les autres services vérifient en local via JWKS
      // (stateless). Pas de révocation possible → courte durée = fenêtre d'exposition limitée.
      jwt: { expirationTime: "15m" },
    }),
  ],
});

// Exporté pour fermeture propre dans server.ts (SIGINT/SIGTERM).
export { redisClient };
