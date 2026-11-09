import { is } from 'drizzle-orm';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw';

import { cf } from '@/lib/cf';

import * as schema from './schema';

type Db = DrizzleD1Database<typeof schema>;

// La base de datos D1 de Cloudflare (binding `DB` en wrangler.jsonc). Se abre en cada petición, porque en un Worker
// los bindings llegan con la petición; `db` se usa como siempre (`db.select()…`).
const porBinding = new WeakMap<D1Database, Db>();
function abrir(): Db {
  const d1 = cf().DB;
  let d = porBinding.get(d1);
  if (!d) {
    d = drizzle(d1, { schema, casing: 'snake_case' });
    // Drizzle 0.45 no prepara las consultas `sql` crudas dentro de `db.batch()`: se les da su sentencia aquí.
    const batch = d.batch.bind(d);
    d.batch = ((queries: Parameters<Db['batch']>[0]) => {
      for (const q of queries) if (is(q, SQLiteRaw) && !('stmt' in q)) Object.assign(q, { stmt: d1.prepare(q.getQuery().sql) });
      return batch(queries);
    }) as unknown as Db['batch'];
    porBinding.set(d1, d);
  }
  return d;
}

export const db = new Proxy({} as Db, {
  get(_, prop) {
    const d = abrir();
    const v = Reflect.get(d, prop) as unknown;
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(d) : v;
  },
});
