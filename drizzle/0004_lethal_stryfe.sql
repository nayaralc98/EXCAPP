CREATE TABLE `avisos_enviados` (
	`clave` text PRIMARY KEY NOT NULL,
	`enviado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehiculos` (
	`id` text PRIMARY KEY NOT NULL,
	`matricula` text NOT NULL,
	`nombre` text DEFAULT '' NOT NULL,
	`tipo` text DEFAULT 'camión' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehiculos_matricula_unique` ON `vehiculos` (`matricula`);--> statement-breakpoint
ALTER TABLE `albaranes` ADD `numero` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `albaranes` ADD `matricula` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `albaranes` ADD `material` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `albaranes` ADD `cantidad` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `albaranes` ADD `leido_ia` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `albaranes_matricula_idx` ON `albaranes` (`matricula`);