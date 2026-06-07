import Fastify from "fastify";
import cors from "@fastify/cors";
import { auth } from "./auth.js";
import { env } from "./env.js";

const app = Fastify({ logger: true });

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
    res.headers.forEach((value, key) => reply.header(key, value));
    reply.send(res.body ? await res.text() : null);
  },
});

try {
  const address = await app.listen({ port: env.AUTH_PORT, host: "0.0.0.0" });
  app.log.info(`Auth service prêt sur ${address}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
