import { loadEnv, z } from "@replang-app/shared";

// Variables d'environnement attendues par le service Auth.
// Le service refuse de démarrer si l'une manque/est invalide (fail-fast).
export const env = loadEnv(
  z.object({
    NODE_ENV: z.string().default("development"),
    AUTH_PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(16),
    BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
    // Origines frontend autorisées (CORS + Better-Auth), séparées par des virgules.
    TRUSTED_ORIGINS: z.string().default("http://localhost:3000"),
  }),
);
