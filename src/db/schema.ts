import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Tles = sqliteTable("tle", {
  noradCatId: integer().primaryKey(),
  name: text(),
  line1: text().notNull(),
  line2: text().notNull(),
});
