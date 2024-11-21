import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { Tle } from "ootk-core";
import { db } from "./db/db";
import * as schema from "./db/schema";

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
  const tles = await db.select().from(schema.Tles);
  return tles.flatMap((tle) => [tle.name, tle.line1, tle.line2]).join("\n");
});

function* splitTle(raw: string) {
  const lines = raw.split("\n");
  let state: { objectName?: string; line1?: string } = {};

  for (const line of lines) {
    if (line.startsWith("1 ")) {
      state = {
        objectName: state.objectName,
        line1: line,
      };
    } else if (line.startsWith("2 ")) {
      if (state.line1) {
        yield {
          objectName: state.objectName,
          line1: state.line1,
          line2: line,
        };
      }

      state = {};
    } else {
      state = {
        objectName: line,
      };
    }
  }
}

fastify.get("/tle/refresh", async (request, reply) => {
  const response = await fetch(tleSource);
  const text = await response.text();

  const tles = Array.from(splitTle(text), ({ objectName, line1, line2 }) => ({
    noradCatId: Tle.satNum(line1 as any),
    name: objectName?.trim(),
    line1,
    line2,
  }));

  fastify.log.info(`Downloaded and parsed ${tles.length} satellites`);

  await db.delete(schema.Tles);
  for (const values of batch(tles, 400)) {
    fastify.log.info(`Inserting ${values.length} satellites`);
    await db.insert(schema.Tles).values(values);
  }
});

function* batch<T>(arr: readonly T[], batchSize: number) {
  for (let i = 0; i < arr.length; i += batchSize) {
    yield arr.slice(i, i + batchSize);
  }
}

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
      .from(schema.Tles)
      .where(eq(schema.Tles.noradCatId, request.params.noradCatId));

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
