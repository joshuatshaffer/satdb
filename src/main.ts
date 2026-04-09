import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { and, count, eq, gt } from "drizzle-orm";
import Fastify from "fastify";
import { readFile } from "node:fs/promises";
import { Static, TSchema, Type } from "typebox";
import { ErrorResponse } from "./api/schemas/ErrorResponse";
import { OmmSchema } from "./api/schemas/omm";
import { batch } from "./batch";
import { db } from "./db/db";
import { Omm } from "./db/schema";
import { logger } from "./logger";
import { ommToTle } from "./ommToTle";

const Nullable = <T extends TSchema>(schema: T) =>
  Type.Union([schema, Type.Null()]);

const tleSource =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json";

const fastify = Fastify({
  loggerInstance: logger,
}).withTypeProvider<TypeBoxTypeProvider>();

const hiddenTag = "hidden";

await fastify.register(import("@fastify/swagger"), {
  openapi: {
    // https://spec.openapis.org/oas/v3.1.0.html
    openapi: "3.1.0",
    info: { title: "Sat DB", version: "0.0.0" },
  },

  hiddenTag,
});

await fastify.register(import("@fastify/swagger-ui"), {
  routePrefix: "/docs",
});

fastify.get("/", { schema: { tags: [hiddenTag] } }, (request, reply) => {
  reply.redirect("/docs");
});

fastify.get("/health/db", async (request, reply) => {
  const result = await db.run("select 1");
  return { status: "ok", result };
});

fastify.get(
  "/tle",
  {
    schema: {
      response: {
        200: { content: { "text/plain": { schema: Type.String() } } },
      },
    },
  },
  async (request, reply) => {
    const omms = await db.select().from(Omm);
    return (
      omms
        .flatMap((omm) => {
          const tle = ommToTle(omm as any);
          return [tle.name, tle.line1, tle.line2];
        })
        .join("\n") + "\n"
    );
  },
);

const useSampleData = true;

async function fetchCelestrakOmmJson() {
  if (useSampleData) {
    return JSON.parse(
      await readFile("./sample-data/celestrak-active-omm.json", {
        encoding: "utf-8",
      }),
    );
  }

  const response = await fetch(tleSource);
  return await response.json();
}

fastify.get("/tle/refresh", async (request, reply) => {
  const omms: Static<typeof OmmSchema>[] = await fetchCelestrakOmmJson();

  logger.info(`Downloaded and parsed ${omms.length} satellites`);

  await db.delete(Omm);
  for (const values of batch(omms, 400)) {
    logger.info(`Inserting ${values.length} satellites`);
    await db.insert(Omm).values(values);
  }
});

fastify.get(
  "/satellites",
  {
    schema: {
      querystring: Type.Object({
        limit: Type.Integer({ minimum: 1, default: 100 }),
        after: Type.Optional(Type.Integer()),
      }),
      response: {
        200: Type.Object({
          items: Type.Array(OmmSchema),
          totalItems: Type.Integer({ minimum: 0 }),
          next: Nullable(Type.String({ format: "uri-reference" })),
        }),
      },
    },
  },
  async (request, reply) => {
    const { limit, after } = request.query;

    const satellites = await db
      .select()
      .from(Omm)
      .where(and(after !== undefined ? gt(Omm.NORAD_CAT_ID, after) : undefined))
      .limit(limit);

    const [{ totalItems }] = await db.select({ totalItems: count() }).from(Omm);

    return {
      items: satellites.map(
        (omm): Static<typeof OmmSchema> => ({
          ...omm,
          EPHEMERIS_TYPE:
            omm.EPHEMERIS_TYPE === null ? undefined : (omm.EPHEMERIS_TYPE as 0),
          CLASSIFICATION_TYPE:
            omm.CLASSIFICATION_TYPE === null
              ? undefined
              : (omm.CLASSIFICATION_TYPE as "U" | "C"),
          REV_AT_EPOCH: omm.REV_AT_EPOCH ?? undefined,
        }),
      ),

      totalItems,
      next:
        satellites.length >= limit
          ? `/satellites?` +
            new URLSearchParams({
              limit: limit.toString(),
              after: satellites[limit - 1].NORAD_CAT_ID.toString(),
            })
          : null,
    };
  },
);

fastify.get(
  "/satellites/norad-cat-id/:noradCatId/tle",
  {
    schema: {
      params: Type.Object({
        noradCatId: Type.Integer(),
      }),
      response: {
        200: { content: { "text/plain": { schema: Type.String() } } },
        default: ErrorResponse,
      },
    },
  },
  async (request, reply) => {
    const [omm] = await db
      .select()
      .from(Omm)
      .where(eq(Omm.NORAD_CAT_ID, request.params.noradCatId));

    if (!omm) {
      reply.status(404).send({
        errors: [{ message: "No TLE data found for this satellite" }],
      });
      return;
    }

    const tle = ommToTle(omm as any);

    return [tle.name, tle.line1, tle.line2].join("\n") + "\n";
  },
);

async function start() {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();
