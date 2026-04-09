import { readFile } from "node:fs/promises";
import { Static } from "typebox";
import { OmmSchema } from "./api/schemas/omm";
import { batch } from "./batch";
import { db } from "./db/db";
import { Omm } from "./db/schema";
import { logger } from "./logger";

const useSampleData = true;

async function fetchCelestrakOmmJson() {
  if (useSampleData) {
    return JSON.parse(
      await readFile("./sample-data/celestrak-active-omm.json", {
        encoding: "utf-8",
      }),
    );
  }

  const response = await fetch(
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
  );
  return await response.json();
}

export async function pullCelestrakOmmJson() {
  const omms: Static<typeof OmmSchema>[] = await fetchCelestrakOmmJson();

  logger.info(`Downloaded and parsed ${omms.length} satellites`);

  await db.delete(Omm);
  for (const values of batch(omms, 400)) {
    logger.info(`Inserting ${values.length} satellites`);
    await db.insert(Omm).values(values);
  }
}
