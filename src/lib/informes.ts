import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { albaranes, fichajes, users } from '@/db/schema';
import { finDia, inicioDia } from '@/lib/fechas';

/** Mes "AAAA-MM" → rango en ms (hora de Madrid). Por defecto, el mes actual. */
export function rangoMes(mes: string | undefined) {
  const m = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : new Date().toISOString().slice(0, 7);
  const [y, mm] = m.split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  return { mes: m, desde: inicioDia(`${m}-01`)!, hasta: finDia(`${m}-${String(ultimo).padStart(2, '0')}`)! };
}

export const consultaAlbaranesMes = (r: { desde: number; hasta: number }) =>
  db
    .select({ obra: albaranes.obra, cliente: albaranes.cliente, conductorId: albaranes.conductorId, fechaHora: albaranes.fechaHora, matricula: albaranes.matricula, material: albaranes.material, cantidad: albaranes.cantidad })
    .from(albaranes)
    .where(and(gte(albaranes.fechaHora, r.desde), lte(albaranes.fechaHora, r.hasta)))
    .orderBy(asc(albaranes.fechaHora))
    .limit(5000);

export const consultaFichajesMes = (r: { desde: number; hasta: number }) =>
  db
    .select({ usuarioId: fichajes.usuarioId, nombre: users.name, email: users.email, tipo: fichajes.tipo, fechaHora: fichajes.fechaHora })
    .from(fichajes)
    .innerJoin(users, eq(users.id, fichajes.usuarioId))
    .where(and(gte(fichajes.fechaHora, r.desde), lte(fichajes.fechaHora, r.hasta)))
    .orderBy(asc(fichajes.fechaHora))
    .limit(5000);

type Alb = Awaited<ReturnType<typeof consultaAlbaranesMes>>[number];
type Fic = Awaited<ReturnType<typeof consultaFichajesMes>>[number];

/** "Sin obra" agrupa los albaranes sin obra indicada. */
export function resumenObras(rows: Alb[], nombres: Map<string, string>) {
  const g = new Map<string, { obra: string; cliente: string; albaranes: number; conductores: Set<string>; dias: Set<string>; materiales: Map<string, number> }>();
  for (const a of rows) {
    const k = `${a.obra}|${a.cliente}`;
    const x = g.get(k) ?? { obra: a.obra || 'Sin obra indicada', cliente: a.cliente, albaranes: 0, conductores: new Set(), dias: new Set(), materiales: new Map() };
    x.albaranes++;
    x.conductores.add(nombres.get(a.conductorId) ?? '—');
    x.dias.add(new Date(a.fechaHora).toISOString().slice(0, 10));
    if (a.material) x.materiales.set(a.material, (x.materiales.get(a.material) ?? 0) + 1);
    g.set(k, x);
  }
  return [...g.values()]
    .sort((a, b) => b.albaranes - a.albaranes)
    .map((x) => ({
      obra: x.obra, cliente: x.cliente, albaranes: x.albaranes, conductores: x.conductores.size, dias: x.dias.size,
      materiales: [...x.materiales.entries()].map(([m, n]) => `${m} (${n})`).join(', '),
    }));
}

export const fmtHoras = (min: number) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`;

/** Empareja cada entrada con la siguiente salida de la misma persona. Entradas sin salida = turnos abiertos. */
export function horasPorTrabajador(rows: Fic[]) {
  const g = new Map<string, { nombre: string; minutos: number; turnos: number; abiertos: number; dias: Set<string>; entrada: number | null }>();
  for (const f of rows) {
    const x = g.get(f.usuarioId) ?? { nombre: f.nombre || f.email, minutos: 0, turnos: 0, abiertos: 0, dias: new Set(), entrada: null };
    if (f.tipo === 'entrada') {
      if (x.entrada !== null) x.abiertos++;
      x.entrada = f.fechaHora;
    } else if (x.entrada !== null) {
      const min = (f.fechaHora - x.entrada) / 60000;
      if (min > 0 && min <= 24 * 60) {
        x.minutos += min;
        x.turnos++;
        x.dias.add(new Date(x.entrada).toISOString().slice(0, 10));
      } else x.abiertos++;
      x.entrada = null;
    }
    g.set(f.usuarioId, x);
  }
  return [...g.values()]
    .map((x) => ({ nombre: x.nombre, minutos: x.minutos, turnos: x.turnos, dias: x.dias.size, abiertos: x.abiertos + (x.entrada !== null ? 1 : 0) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
