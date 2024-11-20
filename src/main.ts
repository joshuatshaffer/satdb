import Fastify from "fastify";
import { db } from "./db/db";
import * as schema from "./db/schema";

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
  const tles = await db.select().from(schema.tles);
  return tles.flatMap((tle) => [tle.name, tle.line1, tle.line2]).join("\n");
});

fastify.get("/tle/refresh", async (request, reply) => {
  const response = await fetch(tleSource);
  const text = await response.text();
  const lines = text.split("\n");
  const tles = [];
  for (let i = 0; i < lines.length; i += 3) {
    tles.push({
      name: lines[i],
      line1: lines[i + 1],
      line2: lines[i + 2],
    });
  }

  await db.delete(schema.tles);
  await db.insert(schema.tles).values(tles);
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
