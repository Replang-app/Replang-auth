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
    // Redis optionnel : si absent, le rate-limit reste en mémoire (une instance).
    REDIS_URL: z.string().url().optional(),
    // Email — transport selon l'environnement :
    //   prod : RESEND_API_KEY requis (resend.com) → SDK Resend
    //   dev  : absent → Nodemailer vers Mailpit (SMTP local, UI sur :8025)
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().default("noreply@replang.app"),
    SMTP_HOST: z.string().default("mailpit"),
    SMTP_PORT: z.coerce.number().default(1025),
    // OAuth — optionnels : le serveur démarre sans eux, la feature est juste désactivée.
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  }),
);
