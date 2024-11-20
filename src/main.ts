import { InferInsertModel } from "drizzle-orm";
import Fastify from "fastify";
import { CelesTrakJson } from "./CelesTrakJson";
import { db } from "./db/db";
import * as schema from "./db/schema";

const tleSource =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle";
const satelliteJsonSource =
  "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json";

const fastify = Fastify({
  logger: true,
});

fastify.get("/health/db", async (request, reply) => {
  const result = await db.run("select 1");
  return { status: "ok", result };
});

fastify.get("/tle", async (request, reply) => {
  // TODO: Format TLE on demand. https://github.com/thkruz/ootk-core/blob/main/src/coordinate/FormatTle.ts

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

function celesTrakJsonToSatellite(
  sat: CelesTrakJson
): InferInsertModel<typeof schema.Satellites> {
  return {
    objectName: sat.OBJECT_NAME,
    objectId: sat.OBJECT_ID,
    epoch: sat.EPOCH,
    meanMotion: sat.MEAN_MOTION,
    eccentricity: sat.ECCENTRICITY,
    inclination: sat.INCLINATION,
    raOfAscNode: sat.RA_OF_ASC_NODE,
    argOfPericenter: sat.ARG_OF_PERICENTER,
    meanAnomaly: sat.MEAN_ANOMALY,
    ephemerisType: sat.EPHEMERIS_TYPE,
    classificationType: sat.CLASSIFICATION_TYPE,
    noradCatId: sat.NORAD_CAT_ID,
    elementSetNo: sat.ELEMENT_SET_NO,
    revAtEpoch: sat.REV_AT_EPOCH,
    bstar: sat.BSTAR,
    meanMotionDot: sat.MEAN_MOTION_DOT,
    meanMotionDDot: sat.MEAN_MOTION_DDOT,
  };
}

function* batch<T>(arr: readonly T[], batchSize: number) {
  for (let i = 0; i < arr.length; i += batchSize) {
    yield arr.slice(i, i + batchSize);
  }
}

fastify.get("/satellites/refresh", async (request, reply) => {
  const response = await fetch(satelliteJsonSource);
  const json: CelesTrakJson[] = await response.json();
  const satellites = json.map(celesTrakJsonToSatellite);

  fastify.log.info(`Downloaded and parsed ${satellites.length} satellites`);

  await db.delete(schema.Satellites);
  for (const satelliteBatch of batch(satellites, 400)) {
    fastify.log.info(`Inserting ${satelliteBatch.length} satellites`);
    await db.insert(schema.Satellites).values(satelliteBatch);
  }

  return { numberSatellites: satellites.length };
});

fastify.get("/satellites", async (request, reply) => {
  return await db.select().from(schema.Satellites).limit(10);
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
