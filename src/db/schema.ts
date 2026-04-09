import { integer, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import Type from "typebox";

export const OmmSchema = Type.Object({
  OBJECT_NAME: Type.String(),
  OBJECT_ID: Type.String(),
  EPOCH: Type.String({
    format: "date-time",
    // From CCSDS 502.0-B-3 section 7.5.10
    pattern: /^\d\d\d\d-(\d\d-\d\d|\d\d\d)T\d\d:\d\d:\d\d(\.d*)?Z?$/.source,
  }),
  MEAN_MOTION: Type.Number(),
  ECCENTRICITY: Type.Number(),
  INCLINATION: Type.Number(),
  RA_OF_ASC_NODE: Type.Number(),
  ARG_OF_PERICENTER: Type.Number(),
  MEAN_ANOMALY: Type.Number(),
  EPHEMERIS_TYPE: Type.Optional(Type.Literal(0)),
  CLASSIFICATION_TYPE: Type.Optional(Type.Enum(["U", "C"])),
  NORAD_CAT_ID: Type.Integer(),
  ELEMENT_SET_NO: Type.Integer(),
  REV_AT_EPOCH: Type.Optional(Type.Integer()),
  BSTAR: Type.Number(),
  MEAN_MOTION_DOT: Type.Number(),
  MEAN_MOTION_DDOT: Type.Number(),
});

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
