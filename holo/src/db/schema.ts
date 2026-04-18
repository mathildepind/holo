import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  packSize: text("pack_size").notNull(),
  unitPrice: real("unit_price").notNull(),
  scanPrefix: text("scan_prefix").notNull(),
});
