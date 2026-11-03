CREATE TABLE `albaranes` (
	`id` text PRIMARY KEY NOT NULL,
	`foto_url` text,
	`foto_key` text,
	`conductor_id` text NOT NULL,
	`fecha_hora` integer NOT NULL,
	`obra` text DEFAULT '' NOT NULL,
	`cliente` text DEFAULT '' NOT NULL,
	`lat` real,
	`lng` real,
	`estado_sync` text DEFAULT 'sincronizado' NOT NULL,
	`uuid_local` text NOT NULL,
	FOREIGN KEY (`conductor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `albaranes_conductor_idx` ON `albaranes` (`conductor_id`);--> statement-breakpoint
CREATE INDEX `albaranes_fecha_idx` ON `albaranes` (`fecha_hora`);--> statement-breakpoint
CREATE INDEX `albaranes_uuid_idx` ON `albaranes` (`uuid_local`);--> statement-breakpoint
CREATE TABLE `fichajes` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`fecha_hora` integer NOT NULL,
	`lat` real,
	`lng` real,
	`estado_sync` text DEFAULT 'sincronizado' NOT NULL,
	`uuid_local` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `fichajes_usuario_idx` ON `fichajes` (`usuario_id`,`fecha_hora`);--> statement-breakpoint
CREATE INDEX `fichajes_fecha_idx` ON `fichajes` (`fecha_hora`);--> statement-breakpoint
CREATE INDEX `fichajes_uuid_idx` ON `fichajes` (`uuid_local`);--> statement-breakpoint
CREATE TABLE `obras` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`cliente` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `perfiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`rol` text DEFAULT 'conductor' NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
