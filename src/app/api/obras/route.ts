import { asc } from 'drizzle-orm';

import { db } from '@/db';
import { obras } from '@/db/schema';
import { loadPage } from '@/lib/load-page';

export async function GET() {
  const { user, data } = await loadPage(() => [db.select().from(obras).orderBy(asc(obras.nombre)).limit(200)], { signedIn: true });
  if (!user) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, obras: data[0] });
}
