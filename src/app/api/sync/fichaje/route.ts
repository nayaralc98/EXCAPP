import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { fichajes } from '@/db/schema';
import { loadPage } from '@/lib/load-page';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// Recibe un fichaje guardado en el móvil. `uuid_local` evita duplicados en reintentos.
export async function POST(req: Request) {
  const { user } = await loadPage((me) => [db.select({ id: fichajes.id }).from(fichajes).where(eq(fichajes.id, me))], {
    signedIn: true,
  });
  if (!user) return Response.json({ ok: false, error: 'Inicia sesión' }, { status: 401 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const uuid = String(b?.uuid_local ?? '');
  const fecha = num(b?.fecha_hora);
  if (!b || !/^[\w-]{8,64}$/.test(uuid) || fecha === null || (b.tipo !== 'entrada' && b.tipo !== 'salida'))
    return Response.json({ ok: false, error: 'Datos no válidos' }, { status: 400 });
  const dup = await db
    .select({ id: fichajes.id })
    .from(fichajes)
    .where(and(eq(fichajes.usuarioId, user.id), eq(fichajes.uuidLocal, uuid)))
    .limit(1);
  if (dup[0]) return Response.json({ ok: true, id: dup[0].id, duplicado: true });
  const id = crypto.randomUUID();
  await db
    .insert(fichajes)
    .values({ id, usuarioId: user.id, tipo: b.tipo, fechaHora: fecha, lat: num(b.lat), lng: num(b.lng), estadoSync: 'sincronizado', uuidLocal: uuid })
    .onConflictDoNothing();
  console.log('sync fichaje ok', id);
  return Response.json({ ok: true, id });
}
