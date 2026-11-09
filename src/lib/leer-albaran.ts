import { z } from 'zod';

import { cf } from '@/lib/cf';

// Lectura de fotos con Workers AI de Cloudflare (cupo diario gratuito). Modelo multimodal que devuelve JSON.
const MODELO = '@cf/meta/llama-4-scout-17b-16e-instruct';

function base64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function leerJson<T>(imagen: Uint8Array, mediaType: string, instrucciones: string, esquema: z.ZodType<T>): Promise<T | null> {
  try {
    const r = (await cf().AI.run(MODELO as Parameters<Ai['run']>[0], {
      messages: [
        { role: 'system', content: 'Respondes solo con un objeto JSON válido, sin texto alrededor.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: instrucciones },
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64(imagen)}` } },
          ],
        },
      ],
      response_format: { type: 'json_schema', json_schema: z.toJSONSchema(esquema) },
      max_tokens: 400,
    } as never)) as { response?: unknown };
    const crudo = typeof r.response === 'string' ? JSON.parse(r.response.replace(/^[^{]*|[^}]*$/g, '')) : r.response;
    const p = esquema.safeParse(crudo);
    if (!p.success) console.error('lectura IA: respuesta no válida', r.response);
    return p.success ? p.data : null;
  } catch (err) {
    console.error('lectura IA: fallo', err);
    return null;
  }
}

const esquema = z.object({
  numero: z.string().describe('Número de albarán, vacío si no se ve'),
  obra: z.string().describe('Obra o destino, vacío si no se ve'),
  cliente: z.string().describe('Cliente, vacío si no se ve'),
  matricula: z.string().describe('Matrícula del camión o máquina, vacío si no se ve'),
  material: z.string().describe('Material transportado (tierra, zahorra, escombro…), vacío si no se ve'),
  cantidad: z.string().describe('Cantidad con su unidad (m3, t, viajes), vacío si no se ve'),
});
export type LecturaAlbaran = z.infer<typeof esquema>;

/** Lee los datos de un albarán a partir de los bytes de su foto. Devuelve null si falla. */
export function leerAlbaran(imagen: Uint8Array, mediaType = 'image/jpeg'): Promise<LecturaAlbaran | null> {
  return leerJson(
    imagen,
    mediaType,
    'Esta es la foto de un albarán de transporte o movimiento de tierras (en español). Extrae los datos que se vean con claridad: numero, obra, cliente, matricula, material, cantidad. Si un dato no se ve, déjalo como cadena vacía. No inventes nada.',
    esquema,
  );
}

export const limpiar = (s: string | undefined, max = 120) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const normMatricula = (s: string) => limpiar(s, 20).toUpperCase().replace(/[\s.-]+/g, '');

const esquemaKm = z.object({
  km: z.number().nullable().describe('Lectura total del cuentakilómetros en km; null si no se lee con claridad'),
});

/** Lee los km del cuentakilómetros a partir de la foto del cuadro del camión. Devuelve null si no se lee. */
export async function leerKm(imagen: Uint8Array, mediaType = 'image/jpeg'): Promise<number | null> {
  const r = await leerJson(
    imagen,
    mediaType,
    'Foto del cuadro de instrumentos de un camión. Devuelve {"km": número} con la lectura TOTAL del cuentakilómetros (odómetro), no el parcial (trip) ni la velocidad. Si no se ve con claridad, {"km": null}. No inventes.',
    esquemaKm,
  );
  const km = r?.km;
  return km != null && Number.isFinite(km) && km >= 0 && km < 10_000_000 ? Math.round(km) : null;
}
