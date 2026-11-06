import { generateObject } from 'ai';
import { z } from 'zod';

import { model } from '@/agents/model';

const esquema = z.object({
  numero: z.string().describe('Número de albarán, vacío si no se ve'),
  obra: z.string().describe('Obra o destino, vacío si no se ve'),
  cliente: z.string().describe('Cliente, vacío si no se ve'),
  matricula: z.string().describe('Matrícula del camión o máquina, vacío si no se ve'),
  material: z.string().describe('Material transportado (tierra, zahorra, escombro…), vacío si no se ve'),
  cantidad: z.string().describe('Cantidad con su unidad (m3, t, viajes), vacío si no se ve'),
});
export type LecturaAlbaran = z.infer<typeof esquema>;

/** Lee los datos de un albarán a partir de su foto (bytes o URL). Devuelve null si falla. */
export async function leerAlbaran(imagen: Uint8Array | URL, mediaType = 'image/jpeg'): Promise<LecturaAlbaran | null> {
  try {
    const { object } = await generateObject({
      model: model('vision'),
      schema: esquema,
      abortSignal: AbortSignal.timeout(25_000),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Esta es la foto de un albarán de transporte o movimiento de tierras (en español). Extrae los datos que se vean con claridad; si un dato no se ve, déjalo vacío. No inventes nada.' },
            { type: 'file', mediaType, data: imagen },
          ],
        },
      ],
    });
    return object;
  } catch (err) {
    console.error('leer albarán: fallo de lectura', err);
    return null;
  }
}

export const limpiar = (s: string | undefined, max = 120) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
export const normMatricula = (s: string) => limpiar(s, 20).toUpperCase().replace(/[\s.-]+/g, '');

const esquemaKm = z.object({
  km: z.number().nullable().describe('Lectura total del cuentakilómetros (odómetro) en km, sin decimales parciales; null si no se lee con claridad'),
});

/** Lee los km del cuentakilómetros a partir de la foto del cuadro del camión. Devuelve null si no se lee. */
export async function leerKm(imagen: Uint8Array, mediaType = 'image/jpeg'): Promise<number | null> {
  try {
    const { object } = await generateObject({
      model: model('vision'),
      schema: esquemaKm,
      abortSignal: AbortSignal.timeout(25_000),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Foto del cuadro de instrumentos de un camión. Devuelve la lectura TOTAL del cuentakilómetros (odómetro), no el parcial (trip) ni la velocidad. Si no se ve con claridad, devuelve null. No inventes.' },
            { type: 'file', mediaType, data: imagen },
          ],
        },
      ],
    });
    const km = object.km;
    return km != null && Number.isFinite(km) && km >= 0 && km < 10_000_000 ? Math.round(km) : null;
  } catch (err) {
    console.error('leer km: fallo de lectura', err);
    return null;
  }
}
