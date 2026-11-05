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
