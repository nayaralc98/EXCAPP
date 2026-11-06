import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/db';
import { albaranes, fichajes, incidencias, users } from '@/db/schema';
import { finDia, inicioDia } from '@/lib/fechas';

/** Hoy en Madrid como "AAAA-MM-DD". */
export const hoyMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());

/** Rango de días (por defecto, hoy). Si "hasta" es anterior a "desde", se igualan. */
export function rangoDias(desde?: string, hasta?: string) {
  const d = desde && inicioDia(desde) !== null ? desde : hoyMadrid();
  const h = hasta && finDia(hasta) !== null && hasta >= d ? hasta : d;
  return { desdeTxt: d, hastaTxt: h, desde: inicioDia(d)!, hasta: finDia(h)! };
}

export const consultasPanel = (r: { desde: number; hasta: number }) =>
  [
    db
      .select({ id: albaranes.id, conductorId: albaranes.conductorId, fechaHora: albaranes.fechaHora, obra: albaranes.obra })
      .from(albaranes)
      .where(and(gte(albaranes.fechaHora, r.desde), lte(albaranes.fechaHora, r.hasta)))
      .orderBy(asc(albaranes.fechaHora))
      .limit(10000),
    db
      .select({ id: fichajes.id, usuarioId: fichajes.usuarioId, tipo: fichajes.tipo, fechaHora: fichajes.fechaHora, km: fichajes.km })
      .from(fichajes)
      .where(and(gte(fichajes.fechaHora, r.desde - 14 * 3_600_000), lte(fichajes.fechaHora, r.hasta + 14 * 3_600_000)))
      .orderBy(asc(fichajes.fechaHora))
      .limit(10000),
    db
      .select({ id: incidencias.id, usuarioId: incidencias.usuarioId, tipo: incidencias.tipo, fechaHora: incidencias.fechaHora, comentario: incidencias.comentario, litros: incidencias.litros, importe: incidencias.importe, nombre: users.name, email: users.email })
      .from(incidencias)
      .innerJoin(users, eq(users.id, incidencias.usuarioId))
      .where(and(gte(incidencias.fechaHora, r.desde), lte(incidencias.fechaHora, r.hasta)))
      .orderBy(asc(incidencias.fechaHora))
      .limit(2000),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).limit(1000),
  ] as const;

type Alb = { conductorId: string; fechaHora: number };
type Fic = { usuarioId: string; tipo: string; fechaHora: number; km: number | null };
type Inc = { usuarioId: string; tipo: string };

export type FilaConductor = {
  id: string;
  nombre: string;
  viajes: number;
  minutos: number;
  turnos: number;
  km: number | null;
  incidencias: number;
  /** Viajes por hora fichada. */
  viajesHora: number | null;
  /** Minutos de jornada por viaje. */
  minPorViaje: number | null;
  /** Media de minutos entre un albarán y el siguiente del mismo día. */
  minEntreViajes: number | null;
  kmPorViaje: number | null;
};

const diaMadrid = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date(ms));

export function calcularPanel(alb: Alb[], fic: Fic[], inc: Inc[], nombres: Map<string, string>, r: { desde: number; hasta: number }) {
  const g = new Map<string, FilaConductor & { huecos: number[]; ultimo: number | null; entrada: Fic | null }>();
  const fila = (id: string) => {
    let x = g.get(id);
    if (!x) {
      x = { id, nombre: nombres.get(id) ?? '—', viajes: 0, minutos: 0, turnos: 0, km: null, incidencias: 0, viajesHora: null, minPorViaje: null, minEntreViajes: null, kmPorViaje: null, huecos: [], ultimo: null, entrada: null };
      g.set(id, x);
    }
    return x;
  };

  for (const a of alb) {
    const x = fila(a.conductorId);
    x.viajes++;
    // Huecos de más de 4 h no cuentan (descanso o cambio de día).
    if (x.ultimo !== null && diaMadrid(x.ultimo) === diaMadrid(a.fechaHora)) {
      const m = (a.fechaHora - x.ultimo) / 60000;
      if (m > 0 && m <= 240) x.huecos.push(m);
    }
    x.ultimo = a.fechaHora;
  }
  // Turno = entrada + siguiente salida; cuenta si la entrada cae en el rango.
  for (const f of fic) {
    const x = fila(f.usuarioId);
    if (f.tipo === 'entrada') x.entrada = f;
    else if (x.entrada) {
      const e = x.entrada;
      x.entrada = null;
      const min = (f.fechaHora - e.fechaHora) / 60000;
      if (e.fechaHora < r.desde || e.fechaHora > r.hasta || min <= 0 || min > 24 * 60) continue;
      x.minutos += min;
      x.turnos++;
      if (e.km != null && f.km != null && f.km >= e.km && f.km - e.km < 3000) x.km = (x.km ?? 0) + (f.km - e.km);
    }
  }
  for (const i of inc) fila(i.usuarioId).incidencias++;

  const filas: FilaConductor[] = [...g.values()]
    .filter((x) => x.viajes || x.turnos || x.incidencias)
    .map(({ huecos, ultimo: _u, entrada: _e, ...x }) => ({
      ...x,
      viajesHora: x.minutos > 0 ? x.viajes / (x.minutos / 60) : null,
      minPorViaje: x.minutos > 0 && x.viajes > 0 ? x.minutos / x.viajes : null,
      minEntreViajes: huecos.length ? huecos.reduce((s, n) => s + n, 0) / huecos.length : null,
      kmPorViaje: x.km != null && x.viajes > 0 ? x.km / x.viajes : null,
    }))
    .sort((a, b) => b.viajes - a.viajes || a.nombre.localeCompare(b.nombre, 'es'));

  const suma = (k: 'viajes' | 'minutos') => filas.reduce((s, f) => s + f[k], 0);
  const viajes = suma('viajes');
  const minutos = suma('minutos');
  const viajesFichados = filas.filter((f) => f.minutos > 0).reduce((s, f) => s + f.viajes, 0);
  const conKm = filas.filter((f) => f.km != null);
  const huecosTodos = filas.filter((f) => f.minEntreViajes != null);
  const conductoresActivos = filas.filter((f) => f.viajes || f.turnos).length;
  return {
    filas,
    total: {
      viajes,
      minutos,
      conductores: conductoresActivos,
      viajesPorConductor: conductoresActivos ? viajes / conductoresActivos : null,
      // Solo con los viajes de quien ha fichado, para no inflar el rendimiento.
      viajesHora: minutos > 0 ? viajesFichados / (minutos / 60) : null,
      minPorViaje: minutos > 0 && viajesFichados > 0 ? minutos / viajesFichados : null,
      minEntreViajes: huecosTodos.length ? huecosTodos.reduce((s, f) => s + f.minEntreViajes! * (f.viajes - 1), 0) / huecosTodos.reduce((s, f) => s + (f.viajes - 1), 0) : null,
      km: conKm.length ? conKm.reduce((s, f) => s + f.km!, 0) : null,
    },
  };
}

export const fmtMin = (m: number | null) => (m == null ? '—' : m >= 60 ? `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')} min` : `${Math.round(m)} min`);
export const fmtNum = (n: number | null, dec = 1) => (n == null ? '—' : n.toLocaleString('es-ES', { maximumFractionDigits: dec }));
