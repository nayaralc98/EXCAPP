import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { fichajes } from '@/db/schema';
import { guardarFoto } from '@/lib/fotos';
import { leerKm, normMatricula } from '@/lib/leer-albaran';
import { loadPage } from '@/lib/load-page';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

// Recibe un fichaje guardado en el móvil (JSON o, si lleva foto de los km, multipart). `uuid_local` evita duplicados.
export async function POST(req: Request) {
  const { user } = await loadPage((me) => [db.select({ id: fichajes.id }).from(fichajes).where(eq(fichajes.id, me))], {
    signedIn: true,
  });
  if (!user) return Response.json({ ok: false, error: 'Inicia sesión' }, { status: 401 });

  let b: Record<string, unknown> | null = null;
  let foto: File | null = null;
  if ((req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    if (form) {
      b = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string'));
      const f = form.get('foto_km');
      if (f instanceof File && f.size > 0) foto = f;
    }
  } else b = (await req.json().catch(() => null)) as Record<string, unknown> | null;

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

  let km = num(b.km);
  if (km !== null && (km < 0 || km >= 10_000_000)) km = null;
  let kmLeidoIa = 0;
  let fotoKmUrl: string | null = null;
  let fotoKmKey: string | null = null;
  if (foto) {
    if (!IMAGE_TYPES.includes(foto.type) || foto.size > 10_000_000)
      return Response.json({ ok: false, error: 'Foto no válida (JPEG, PNG o WebP, hasta 10 MB)' }, { status: 400 });
    try {
      fotoKmKey = await guardarFoto(`km/${user.id}/${uuid}.jpg`, foto, foto.type);
    } catch (err) {
      console.error('sync fichaje: foto km no subida', err);
      return Response.json({ ok: false, error: 'No se pudo subir la foto de los km' }, { status: 502 });
    }
    // Lo escrito por el conductor manda; la IA solo rellena si lo dejó vacío.
    if (km === null) {
      km = await leerKm(new Uint8Array(await foto.arrayBuffer()), foto.type);
      if (km !== null) kmLeidoIa = 1;
    }
  }

  const id = crypto.randomUUID();
  await db
    .insert(fichajes)
    .values({
      id, usuarioId: user.id, tipo: b.tipo, fechaHora: fecha, lat: num(b.lat), lng: num(b.lng), estadoSync: 'sincronizado', uuidLocal: uuid,
      km, kmLeidoIa, fotoKmUrl, fotoKmKey, matricula: normMatricula(String(b.matricula ?? '')),
    })
    .onConflictDoNothing();
  console.log('sync fichaje ok', id);
  return Response.json({ ok: true, id, km });
}
