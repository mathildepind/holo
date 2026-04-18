CREATE TABLE `bills_of_lading` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bol_number` text NOT NULL,
	`pack_record_id` integer NOT NULL,
	`shipment_id` integer NOT NULL,
	`pallet_count` integer NOT NULL,
	`total_weight` real NOT NULL,
	`temp_requirements` text NOT NULL,
	`generated_by` text NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`pack_record_id`) REFERENCES `pack_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bills_of_lading_bol_number_unique` ON `bills_of_lading` (`bol_number`);--> statement-breakpoint
CREATE TABLE `carriers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pack_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pack_record_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity_packed` integer NOT NULL,
	`discrepancy_note` text,
	FOREIGN KEY (`pack_record_id`) REFERENCES `pack_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pack_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text NOT NULL,
	`packed_by` text NOT NULL,
	`notes` text NOT NULL,
	`verified_at` text,
	FOREIGN KEY (`order_id`) REFERENCES `sales_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`carrier_id` integer NOT NULL,
	`ship_date` text NOT NULL,
	`status` text NOT NULL,
	`departed_at` text,
	`delivered_at` text,
	FOREIGN KEY (`carrier_id`) REFERENCES `carriers`(`id`) ON UPDATE no action ON DELETE no action
);
