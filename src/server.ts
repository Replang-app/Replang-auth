import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "@replang-app/db";
import { auth, redisClient } from "./auth.js";
import { env } from "./env.js";

// trustProxy : Fastify lit req.ip depuis X-Forwarded-For au lieu de l'IP du proxy Docker.
const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, {
  origin: env.TRUSTED_ORIGINS.split(",").map((o) => o.trim()),
  credentials: true,
});

// Sonde de santé (utilisée par Docker / Traefik).
app.get("/health", async () => ({ status: "ok", service: "auth" }));

/**
 * Toutes les routes /api/auth/* sont déléguées au handler Better-Auth.
 * Better-Auth fonctionne avec l'API web standard (Request/Response) ; on
 * fait donc le pont entre la requête Fastify et un objet Request.
 */
app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    const url = new URL(request.url, env.BETTER_AUTH_URL);

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined) continue;
      if (key === "content-length") continue; // recalculé après re-sérialisation
      headers.append(key, Array.isArray(value) ? value.join(", ") : value);
    }

    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const req = new Request(url, {
      method: request.method,
      headers,
      body: hasBody ? JSON.stringify(request.body ?? {}) : undefined,
    });

    const res = await auth.handler(req);

    reply.status(res.status);
    // Les Set-Cookie multiples doivent être renvoyés séparément :
    // Headers.forEach les fusionnerait en une seule valeur (cookies corrompus).
    const setCookies = res.headers.getSetCookie();
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return;
      reply.header(key, value);
    });
    for (const cookie of setCookies) {
      reply.header("set-cookie", cookie);
    }

    const text = await res.text();
    reply.send(text.length > 0 ? text : null);
  },
});

// Arrêt propre (ferme le serveur + la connexion Prisma) pour les conteneurs.
async function shutdown(signal: string) {
  app.log.info(`Reçu ${signal}, arrêt en cours…`);
  try {
    await app.close();
    await prisma.$disconnect();
    if (redisClient) await redisClient.quit();
    process.exit(0);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  const address = await app.listen({ port: env.AUTH_PORT, host: "0.0.0.0" });
  app.log.info(`Auth service prêt sur ${address}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
