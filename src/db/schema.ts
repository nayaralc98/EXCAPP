// The project's Drizzle schema — the source of truth for `npm run db:generate` (A3.5). Add the app's tables
// below. Event logs, telemetry and analytics streams do not belong in this database (A3.18).
export * from './schema.auth';

import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { users } from './schema.auth';

/** Rol de cada persona (conductor, administrativo, gerente). Sin fila = conductor. */
export const perfiles = sqliteTable('perfiles', {
  userId: text('user_id').primaryKey().references(() => users.id),
  rol: text('rol').notNull().default('conductor'),
  updatedAt: integer('updated_at').notNull().default(0),
});

export const obras = sqliteTable('obras', {
  id: text().primaryKey(),
  nombre: text().notNull(),
  cliente: text().notNull(),
});

export const albaranes = sqliteTable(
  'albaranes',
  {
    id: text().primaryKey(),
    fotoUrl: text('foto_url'),
    fotoKey: text('foto_key'),
    conductorId: text('conductor_id').notNull().references(() => users.id),
    fechaHora: integer('fecha_hora').notNull(),
    obra: text().notNull().default(''),
    cliente: text().notNull().default(''),
    lat: real(),
    lng: real(),
    estadoSync: text('estado_sync').notNull().default('sincronizado'),
    uuidLocal: text('uuid_local').notNull(),
    numero: text().notNull().default(''),
    matricula: text().notNull().default(''),
    material: text().notNull().default(''),
    cantidad: text().notNull().default(''),
    leidoIa: integer('leido_ia').notNull().default(0),
  },
  (t) => [
    index('albaranes_matricula_idx').on(t.matricula),
    index('albaranes_conductor_idx').on(t.conductorId),
    index('albaranes_fecha_idx').on(t.fechaHora),
    index('albaranes_uuid_idx').on(t.uuidLocal),
    uniqueIndex('albaranes_conductor_uuid_unique').on(t.conductorId, t.uuidLocal),
  ],
);

export const fichajes = sqliteTable(
  'fichajes',
  {
    id: text().primaryKey(),
    usuarioId: text('usuario_id').notNull().references(() => users.id),
    tipo: text().notNull(),
    fechaHora: integer('fecha_hora').notNull(),
    lat: real(),
    lng: real(),
    estadoSync: text('estado_sync').notNull().default('sincronizado'),
    uuidLocal: text('uuid_local').notNull(),
  },
  (t) => [
    index('fichajes_usuario_idx').on(t.usuarioId, t.fechaHora),
    index('fichajes_fecha_idx').on(t.fechaHora),
    index('fichajes_uuid_idx').on(t.uuidLocal),
    uniqueIndex('fichajes_usuario_uuid_unique').on(t.usuarioId, t.uuidLocal),
  ],
);

/** Máquinas y camiones de la empresa (matrícula y nombre). */
export const vehiculos = sqliteTable('vehiculos', {
  id: text().primaryKey(),
  matricula: text().notNull().unique(),
  nombre: text().notNull().default(''),
  tipo: text().notNull().default('camión'),
});

/** Avisos ya enviados por e-mail (evita repetirlos). */
export const avisosEnviados = sqliteTable('avisos_enviados', {
  clave: text().primaryKey(),
  enviadoEn: integer('enviado_en').notNull(),
});
