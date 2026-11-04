import { and, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { albaranes, avisosEnviados, fichajes, users } from '@/db/schema';
import { avisarOficina } from '@/lib/avisos';
import { cronJob } from '@/lib/cron-job';
import { fmtFechaHora, inicioDia } from '@/lib/fechas';
import { horasPorTrabajador } from '@/lib/informes';

const h = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// Cada mañana: avisa a la oficina de lo que ayer quedó a medias (albaranes sin obra, entradas sin salida).
async function avisosDeAyer() {
  const hoy = inicioDia(new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }))!;
  const desde = hoy - 86_400_000;
  const hasta = hoy - 1;
  const dia = new Date(desde + 43_200_000).toISOString().slice(0, 10);
  const clave = `diario-${dia}`;
  const ya = await db.select().from(avisosEnviados).where(eq(avisosEnviados.clave, clave)).limit(1);
  if (ya[0]) return { enviado: false, motivo: 'ya enviado' };

  const sinObra = await db
    .select({ fecha: albaranes.fechaHora, conductor: users.name })
    .from(albaranes)
    .innerJoin(users, eq(users.id, albaranes.conductorId))
    .where(and(gte(albaranes.fechaHora, desde), lte(albaranes.fechaHora, hasta), eq(albaranes.obra, '')))
    .limit(100);
  const fich = await db
    .select({ usuarioId: fichajes.usuarioId, nombre: users.name, email: users.email, tipo: fichajes.tipo, fechaHora: fichajes.fechaHora })
    .from(fichajes)
    .innerJoin(users, eq(users.id, fichajes.usuarioId))
    .where(and(gte(fichajes.fechaHora, desde), lte(fichajes.fechaHora, hasta)))
    .orderBy(fichajes.fechaHora)
    .limit(2000);
  const abiertos = horasPorTrabajador(fich).filter((x) => x.abiertos > 0);
  if (!sinObra.length && !abiertos.length) return { enviado: false, motivo: 'nada que avisar' };

  const partes: string[] = [`<h2>Resumen del ${dia}</h2>`];
  if (abiertos.length)
    partes.push(`<h3>Entradas sin salida</h3><ul>${abiertos.map((x) => `<li>${h(x.nombre)}</li>`).join('')}</ul>`);
  if (sinObra.length)
    partes.push(`<h3>Albaranes sin obra (${sinObra.length})</h3><ul>${sinObra.slice(0, 30).map((a) => `<li>${fmtFechaHora(a.fecha)} · ${h(a.conductor ?? '')}</li>`).join('')}</ul>`);
  const n = await avisarOficina(`Avisos del ${dia}`, partes.join(''), clave);
  if (n) await db.insert(avisosEnviados).values({ clave, enviadoEn: Date.now() }).onConflictDoNothing();
  return { enviado: n > 0, destinatarios: n };
}

export function POST(req: Request) {
  return cronJob(req, 'avisos diarios', () => avisosDeAyer());
}
