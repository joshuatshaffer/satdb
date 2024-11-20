import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tles = sqliteTable("tle", {
  name: text(),
  line1: text(),
  line2: text(),
});
