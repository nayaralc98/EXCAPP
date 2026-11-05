import { eq } from 'drizzle-orm';
import { totalum } from 'totalum-sdk';

import { db } from '@/db';
import { albaranes } from '@/db/schema';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

// La foto original de un albarán: solo la ve la oficina o el conductor que la hizo.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, data } = await loadPage(
    (me) => [perfilQuery(me), db.select().from(albaranes).where(eq(albaranes.id, id)).limit(1)],
    { signedIn: true },
  );
  if (!user) return new Response('Inicia sesión', { status: 401 });
  const a = data[1][0];
  if (!a || !a.fotoUrl && !a.fotoKey) return new Response('No encontrada', { status: 404 });
  if (a.conductorId !== user.id && !esOficina(rolDe(user, data[0]))) return new Response('Sin permiso', { status: 403 });
  try {
    const url = a.fotoKey ? await totalum.files.getSignedUrl(a.fotoKey) : a.fotoUrl!;
    return Response.redirect(url, 302);
  } catch (err) {
    console.error('foto albaran', err);
    return new Response('No disponible', { status: 502 });
  }
}
