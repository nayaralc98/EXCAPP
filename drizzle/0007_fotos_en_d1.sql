CREATE TABLE `fotos` (
	`clave` text PRIMARY KEY NOT NULL,
	`tipo` text DEFAULT 'image/jpeg' NOT NULL,
	`datos` blob NOT NULL,
	`creado_en` integer NOT NULL
);
