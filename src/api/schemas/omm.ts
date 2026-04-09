import Type from "typebox";

/**
 * Orbit Mean Elements Message
 */
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
