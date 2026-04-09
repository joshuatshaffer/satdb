import { integer, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Omm = sqliteTable("omm", {
  OBJECT_NAME: text().notNull(),
  OBJECT_ID: text().primaryKey(),
  EPOCH: text().notNull(),
  MEAN_MOTION: numeric({ mode: "number" }).notNull(),
  ECCENTRICITY: numeric({ mode: "number" }).notNull(),
  INCLINATION: numeric({ mode: "number" }).notNull(),
  RA_OF_ASC_NODE: numeric({ mode: "number" }).notNull(),
  ARG_OF_PERICENTER: numeric({ mode: "number" }).notNull(),
  MEAN_ANOMALY: numeric({ mode: "number" }).notNull(),
  EPHEMERIS_TYPE: integer(),
  CLASSIFICATION_TYPE: text(),
  NORAD_CAT_ID: integer().notNull(),
  ELEMENT_SET_NO: integer().notNull(),
  REV_AT_EPOCH: integer(),
  BSTAR: numeric({ mode: "number" }).notNull(),
  MEAN_MOTION_DOT: numeric({ mode: "number" }).notNull(),
  MEAN_MOTION_DDOT: numeric({ mode: "number" }).notNull(),
});
