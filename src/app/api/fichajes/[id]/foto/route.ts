import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { fichajes } from '@/db/schema';
import { respuestaFoto } from '@/lib/fotos';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

// Foto del cuentakilómetros de un fichaje: solo la ve la oficina o quien fichó.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, data } = await loadPage(
    (me) => [perfilQuery(me), db.select().from(fichajes).where(eq(fichajes.id, id)).limit(1)],
    { signedIn: true },
  );
  if (!user) return new Response('Inicia sesión', { status: 401 });
  const a = data[1][0];
  if (!a?.fotoKmKey) return new Response('No encontrada', { status: 404 });
  if (a.usuarioId !== user.id && !esOficina(rolDe(user, data[0]))) return new Response('Sin permiso', { status: 403 });
  return respuestaFoto(a.fotoKmKey);
}
