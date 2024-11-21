import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Tles = sqliteTable("tle", {
  noradCatId: integer().primaryKey(),
  name: text(),
  line1: text().notNull(),
  line2: text().notNull(),
});

export const Satellites = sqliteTable("satellites", {
  objectName: text(),
  objectId: text(),
  epoch: text(),
  meanMotion: real(),
  eccentricity: real(),
  inclination: real(),
  raOfAscNode: real(),
  argOfPericenter: real(),
  meanAnomaly: real(),
  ephemerisType: integer(),
  classificationType: text(),
  noradCatId: integer().notNull().unique(),
  elementSetNo: integer(),
  revAtEpoch: integer(),
  bstar: real(),
  meanMotionDot: real(),
  meanMotionDDot: real(),
});
