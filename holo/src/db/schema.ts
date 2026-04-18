import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
});
