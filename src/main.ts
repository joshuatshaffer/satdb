import Fastify from "fastify";
import { db } from "./db/db";

const tleSource =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";

const fastify = Fastify({
  logger: true,
});

fastify.get("/health/db", async (request, reply) => {
  const result = await db.run("select 1");
  return { status: "ok", result };
});

fastify.get("/tle", async (request, reply) => {
  return fetch(tleSource);
});

async function start() {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
