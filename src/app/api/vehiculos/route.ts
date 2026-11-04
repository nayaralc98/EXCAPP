import { asc } from 'drizzle-orm';

import { db } from '@/db';
import { vehiculos } from '@/db/schema';
import { loadPage } from '@/lib/load-page';

export async function GET() {
  const { user, data } = await loadPage(() => [db.select().from(vehiculos).orderBy(asc(vehiculos.nombre)).limit(300)], { signedIn: true });
  if (!user) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, vehiculos: data[0] });
}
