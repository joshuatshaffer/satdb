import { OMMJsonObjectV3 } from "satellite.js";
import { expect, test } from "vitest";
import { Tle, ommToTle } from "./ommToTle";

const issOmmJson: OMMJsonObjectV3 = {
  OBJECT_NAME: "ISS (ZARYA)",
  OBJECT_ID: "1998-067A",
  EPOCH: "2026-04-08T12:30:47.352960",
  MEAN_MOTION: 15.48832031,
  ECCENTRICITY: 0.00063527,
  INCLINATION: 51.633,
  RA_OF_ASC_NODE: 284.8633,
  ARG_OF_PERICENTER: 287.8392,
  MEAN_ANOMALY: 72.1903,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: "U",
  NORAD_CAT_ID: 25544,
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 56095,
  BSTAR: 0.00013194905,
  MEAN_MOTION_DOT: 6.786e-5,
  MEAN_MOTION_DDOT: 0,
};

const issTle: Tle = {
  name: "ISS (ZARYA)",
  line1:
    "1 25544U 98067A   26098.52138140  .00006786  00000+0  13195-3 0  9997",
  line2:
    "2 25544  51.6330 284.8633 0006352 287.8392  72.1903 15.48832031560951",
};

test("adds 1 + 2 to equal 3", () => {
  expect(ommToTle(issOmmJson)).toEqual(issTle);
});
