import { readFile } from "node:fs/promises";
import { OMMJsonObjectV3 } from "satellite.js";
import { expect, test } from "vitest";
import { Tle, ommToTle } from "./ommToTle";
import { splitTle } from "./parseTleList";

const tles: Tle[] = Array.from(
  splitTle(await readFile("./sample-data/tle.txt", { encoding: "utf-8" })),
  ({ objectName, line1, line2 }) => ({
    name: objectName?.trim() ?? "",
    line1,
    line2,
  }),
);

const omms: OMMJsonObjectV3[] = JSON.parse(
  await readFile("./sample-data/omm.json", { encoding: "utf-8" }),
);

function* zip<X, Y>([xs, ys]: [readonly X[], readonly Y[]]) {
  const length = Math.min(xs.length, ys.length);

  for (let i = 0; i < length; i++) {
    yield [xs[i], ys[i]] satisfies [X, Y];
  }
}

test.each(Array.from(zip([omms, tles]), ([omm, tle]) => ({ omm, tle })))(
  "Converts OMM to TLE for $omm.OBJECT_ID",
  ({ omm, tle }) => {
    expect(ommToTle(omm)).toEqual(tle);
  },
);
