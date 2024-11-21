import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { batch } from "./batch";
import { db } from "./db/db";
import { Tle } from "./db/schema";
import { parseTleList } from "./parseTleList";

const tleSource =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";

const fastify = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

fastify.get("/health/db", async (request, reply) => {
  const result = await db.run("select 1");
  return { status: "ok", result };
});

fastify.get("/tle", async (request, reply) => {
  const tles = await db.select().from(Tle);
  return tles.flatMap((tle) => [tle.name, tle.line1, tle.line2]).join("\n");
});

fastify.get("/tle/refresh", async (request, reply) => {
  const response = await fetch(tleSource);
  const text = await response.text();

  const tles = parseTleList(text);

  fastify.log.info(`Downloaded and parsed ${tles.length} satellites`);

  await db.delete(Tle);
  for (const values of batch(tles, 400)) {
    fastify.log.info(`Inserting ${values.length} satellites`);
    await db.insert(Tle).values(values);
  }
});

fastify.get(
  "/satellites/norad-cat-id/:noradCatId/tle",
  {
    schema: {
      params: Type.Object({
        noradCatId: Type.Integer(),
      }),
    },
  },
  async (request, reply) => {
    const [tle] = await db
      .select()
      .from(Tle)
      .where(eq(Tle.noradCatId, request.params.noradCatId));

    if (!tle) {
      reply.status(404);
      return { error: "No TLE found for this satellite" };
    }

    return [tle.name, tle.line1, tle.line2].join("\n") + "\n";
  }
);

async function start() {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
