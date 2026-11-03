import { and, eq } from 'drizzle-orm';
import { totalum } from 'totalum-sdk';

import { db } from '@/db';
import { albaranes } from '@/db/schema';
import { loadPage } from '@/lib/load-page';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const num = (v: FormDataEntryValue | null) => {
  const n = typeof v === 'string' && v !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

// Recibe un albarán guardado en el móvil. `uuid_local` evita duplicados en reintentos.
export async function POST(req: Request) {
  const { user } = await loadPage((me) => [db.select({ id: albaranes.id }).from(albaranes).where(eq(albaranes.id, me))], {
    signedIn: true,
  });
  if (!user) return Response.json({ ok: false, error: 'Inicia sesión' }, { status: 401 });
  const form = await req.formData();
  const uuid = String(form.get('uuid_local') ?? '');
  const fecha = num(form.get('fecha_hora'));
  if (!/^[\w-]{8,64}$/.test(uuid) || fecha === null)
    return Response.json({ ok: false, error: 'Datos no válidos' }, { status: 400 });

  const dup = await db
    .select({ id: albaranes.id })
    .from(albaranes)
    .where(and(eq(albaranes.conductorId, user.id), eq(albaranes.uuidLocal, uuid)))
    .limit(1);
  if (dup[0]) return Response.json({ ok: true, id: dup[0].id, duplicado: true });

  let fotoUrl: string | null = null;
  let fotoKey: string | null = null;
  const foto = form.get('foto');
  if (foto instanceof File && foto.size > 0) {
    if (!IMAGE_TYPES.includes(foto.type) || foto.size > 10_000_000)
      return Response.json({ ok: false, error: 'Foto no válida (JPEG, PNG o WebP, hasta 10 MB)' }, { status: 400 });
    try {
      const up = await totalum.files.upload(foto, { name: `albaran-${uuid}.jpg`, folder: 'albaranes', contentType: foto.type, private: true });
      fotoKey = up.key;
      fotoUrl = up.fileUrl ?? null;
    } catch (err) {
      console.error('sync albaran: foto no subida', err);
      return Response.json({ ok: false, error: 'No se pudo subir la foto' }, { status: 502 });
    }
  }
  const id = crypto.randomUUID();
  await db
    .insert(albaranes)
    .values({
      id, fotoUrl, fotoKey, conductorId: user.id, fechaHora: fecha,
      obra: String(form.get('obra') ?? '').slice(0, 120), cliente: String(form.get('cliente') ?? '').slice(0, 120),
      lat: num(form.get('lat')), lng: num(form.get('lng')), estadoSync: 'sincronizado', uuidLocal: uuid,
    })
    .onConflictDoNothing();
  console.log('sync albaran ok', id);
  return Response.json({ ok: true, id });
}
