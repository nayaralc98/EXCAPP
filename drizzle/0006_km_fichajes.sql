ALTER TABLE `fichajes` ADD `km` real;--> statement-breakpoint
ALTER TABLE `fichajes` ADD `km_leido_ia` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `fichajes` ADD `foto_km_url` text;--> statement-breakpoint
ALTER TABLE `fichajes` ADD `foto_km_key` text;--> statement-breakpoint
ALTER TABLE `fichajes` ADD `matricula` text DEFAULT '' NOT NULL;