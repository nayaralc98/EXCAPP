import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { fotos } from '@/db/schema';

/** Tamaño máximo de una foto: D1 admite filas de hasta 2 MB. El móvil ya las reduce a ~300 KB. */
export const MAX_FOTO = 1_900_000;

/** Guarda una foto en la base de datos. Devuelve su clave. */
export async function guardarFoto(clave: string, foto: File | Blob, contentType: string): Promise<string> {
  const datos = Buffer.from(await foto.arrayBuffer());
  await db.insert(fotos).values({ clave, tipo: contentType, datos, creadoEn: Date.now() }).onConflictDoNothing();
  return clave;
}

/** Bytes de una foto guardada, o null si no existe. */
export async function bytesFoto(clave: string): Promise<{ bytes: Uint8Array; tipo: string } | null> {
  const [f] = await db.select({ datos: fotos.datos, tipo: fotos.tipo }).from(fotos).where(eq(fotos.clave, clave)).limit(1);
  return f ? { bytes: new Uint8Array(f.datos), tipo: f.tipo } : null;
}

/** Respuesta HTTP con la foto (solo después de comprobar permisos). */
export async function respuestaFoto(clave: string): Promise<Response> {
  const f = await bytesFoto(clave);
  if (!f) return new Response('No encontrada', { status: 404 });
  return new Response(f.bytes as BodyInit, { headers: { 'content-type': f.tipo, 'cache-control': 'private, max-age=3600' } });
}
