CREATE TABLE `incidencias` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`fecha_hora` integer NOT NULL,
	`comentario` text DEFAULT '' NOT NULL,
	`foto_url` text,
	`foto_key` text,
	`litros` real,
	`importe` real,
	`estacion` text DEFAULT '' NOT NULL,
	`lat` real,
	`lng` real,
	`uuid_local` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `incidencias_fecha_idx` ON `incidencias` (`fecha_hora`);--> statement-breakpoint
CREATE INDEX `incidencias_usuario_idx` ON `incidencias` (`usuario_id`,`fecha_hora`);--> statement-breakpoint
CREATE UNIQUE INDEX `incidencias_usuario_uuid_unique` ON `incidencias` (`usuario_id`,`uuid_local`);