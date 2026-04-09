import { OMMJsonObjectV3 } from "satellite.js";

export interface Tle {
  name: string;
  line1: string;
  line2: string;
}

/**
 * Convert from OMM data to TLE strings.
 */
function formatTleExponent(value: number): string {
  if (value === 0) {
    return " 00000+0";
  }

  const sign = value < 0 ? "-" : " ";
  const scientific = Math.abs(value).toExponential(4);
  const [coefficient, exponentText] = scientific.split("e");
  const exponent = parseInt(exponentText, 10) + 1;

  if (Math.abs(exponent) > 9) {
    throw new Error(`Exponent out of TLE range: ${value}`);
  }

  const mantissa = coefficient.replace(".", "").padEnd(5, "0").slice(0, 5);
  const exponentSign = exponent < 0 ? "-" : "+";
  const exponentDigit = String(Math.abs(exponent));

  return `${sign}${mantissa}${exponentSign}${exponentDigit}`;
}

function formatFirstDerivative(value: number): string {
  const sign = value < 0 ? "-" : " ";
  const fixed = Math.abs(value).toFixed(8).replace(/^0/, "");
  return `${sign}${fixed}`;
}

function formatEpoch(epoch: string): string {
  const directMatch = epoch.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z)?$/,
  );

  let year: number;
  let dayOfYear: number;

  if (directMatch) {
    const [, y, m, d, hh, mm, ss, frac = "0"] = directMatch;
    year = Number(y);
    const month = Number(m);
    const day = Number(d);
    const hour = Number(hh);
    const minute = Number(mm);
    const second = Number(ss);
    const fractionalSecond = Number(`0.${frac}`);

    const dayStartMs = Date.UTC(year, month - 1, day);
    const yearStartMs = Date.UTC(year, 0, 1);
    const dayIndex = Math.floor((dayStartMs - yearStartMs) / 86_400_000) + 1;
    const dayFraction =
      (hour * 3600 + minute * 60 + second + fractionalSecond) / 86_400;

    dayOfYear = dayIndex + dayFraction;
  } else {
    const normalized = /Z$/.test(epoch) ? epoch : `${epoch}Z`;
    const epochDate = new Date(normalized);
    year = epochDate.getUTCFullYear();
    dayOfYear =
      (epochDate.getTime() - Date.UTC(epochDate.getUTCFullYear(), 0, 1)) /
        86_400_000 +
      1;
  }

  return `${String(year % 100).padStart(2, "0")}${dayOfYear
    .toFixed(8)
    .padStart(12, "0")}`;
}

function formatIntlDesignator(objectId: string): string {
  const match = objectId.match(/^(\d{4})-(\d{3})([A-Z]{1,3})$/);
  if (!match) {
    return "        ";
  }

  const [, launchYear, launchNumber, piece] = match;
  return `${launchYear.slice(-2)}${launchNumber}${piece.padEnd(3, " ")}`;
}

function checksum(lineWithoutChecksum: string): number {
  let sum = 0;

  for (const char of lineWithoutChecksum) {
    if (char >= "0" && char <= "9") {
      sum += Number(char);
    } else if (char === "-") {
      sum += 1;
    }
  }

  return sum % 10;
}

function asNumber(value: number | string, field: string): number {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(result)) {
    throw new Error(`Invalid numeric OMM field ${field}: ${String(value)}`);
  }

  return result;
}

export function ommToTle(omm: OMMJsonObjectV3): Tle {
  const satNum = String(omm.NORAD_CAT_ID).padStart(5, " ");
  const classification = (omm.CLASSIFICATION_TYPE ?? "U").slice(0, 1);
  const intlDesignator = formatIntlDesignator(omm.OBJECT_ID ?? "");
  const epoch = formatEpoch(omm.EPOCH);
  const meanMotionDot = formatFirstDerivative(
    asNumber(omm.MEAN_MOTION_DOT, "MEAN_MOTION_DOT"),
  );
  const meanMotionDdot = formatTleExponent(
    asNumber(omm.MEAN_MOTION_DDOT, "MEAN_MOTION_DDOT"),
  );
  const bstar = formatTleExponent(asNumber(omm.BSTAR, "BSTAR"));
  const ephemerisType = String(omm.EPHEMERIS_TYPE ?? 0);
  const elementSet = String(omm.ELEMENT_SET_NO ?? 0)
    .slice(-4)
    .padStart(4, " ");

  const line1WithoutChecksum =
    `1 ${satNum}${classification} ${intlDesignator} ${epoch}` +
    ` ${meanMotionDot} ${meanMotionDdot} ${bstar} ${ephemerisType} ${elementSet}`;

  const inclination = asNumber(omm.INCLINATION, "INCLINATION")
    .toFixed(4)
    .padStart(8, " ");
  const raan = asNumber(omm.RA_OF_ASC_NODE, "RA_OF_ASC_NODE")
    .toFixed(4)
    .padStart(8, " ");
  const eccentricity = String(
    Math.trunc(asNumber(omm.ECCENTRICITY, "ECCENTRICITY") * 1e7),
  ).padStart(7, "0");
  const argOfPericenter = asNumber(omm.ARG_OF_PERICENTER, "ARG_OF_PERICENTER")
    .toFixed(4)
    .padStart(8, " ");
  const meanAnomaly = asNumber(omm.MEAN_ANOMALY, "MEAN_ANOMALY")
    .toFixed(4)
    .padStart(8, " ");
  const meanMotion = asNumber(omm.MEAN_MOTION, "MEAN_MOTION")
    .toFixed(8)
    .padStart(11, " ");
  const revAtEpoch = String(omm.REV_AT_EPOCH ?? 0)
    .slice(-5)
    .padStart(5, " ");

  const line2WithoutChecksum =
    `2 ${satNum} ${inclination} ${raan} ${eccentricity} ${argOfPericenter}` +
    ` ${meanAnomaly} ${meanMotion}${revAtEpoch}`;

  return {
    name: omm.OBJECT_NAME,
    line1: `${line1WithoutChecksum}${checksum(line1WithoutChecksum)}`,
    line2: `${line2WithoutChecksum}${checksum(line2WithoutChecksum)}`,
  };
}
