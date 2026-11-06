import { cf } from '@/lib/cf';

/** Guarda una foto en el almacén R2 (privado). Devuelve su clave. */
export async function guardarFoto(clave: string, foto: File | Blob, contentType: string): Promise<string> {
  await cf().FOTOS.put(clave, await foto.arrayBuffer(), { httpMetadata: { contentType } });
  return clave;
}

/** Bytes de una foto guardada, o null si no existe. */
export async function bytesFoto(clave: string): Promise<{ bytes: Uint8Array; tipo: string } | null> {
  const o = await cf().FOTOS.get(clave);
  if (!o) return null;
  return { bytes: new Uint8Array(await o.arrayBuffer()), tipo: o.httpMetadata?.contentType ?? 'image/jpeg' };
}

/** Respuesta HTTP con la foto (solo después de comprobar permisos). */
export async function respuestaFoto(clave: string): Promise<Response> {
  const o = await cf().FOTOS.get(clave);
  if (!o) return new Response('No encontrada', { status: 404 });
  return new Response(o.body, {
    headers: { 'content-type': o.httpMetadata?.contentType ?? 'image/jpeg', 'cache-control': 'private, max-age=3600' },
  });
}
