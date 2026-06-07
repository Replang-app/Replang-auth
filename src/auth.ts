import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { prisma } from "@replang-app/db";
import { env } from "./env.js";

/**
 * Configuration Better-Auth.
 * - prismaAdapter : utilise notre base via @replang/db (tables users/sessions/…).
 * - emailAndPassword : inscription/connexion classiques (mot de passe hashé).
 * - jwt() : émet des JWT et expose un endpoint JWKS (clé publique) sur
 *   /api/auth/jwks, que les autres services utilisent pour vérifier les tokens.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    // Champs métier additionnels exposés/modifiables via Better-Auth.
    additionalFields: {
      displayName: { type: "string", required: false },
    },
  },
  plugins: [jwt()],
});
