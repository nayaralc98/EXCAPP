import { and, desc, eq, gte, lte, like, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { albaranes, users } from '@/db/schema';
import { finDia, inicioDia } from '@/lib/fechas';

export type FiltrosAlbaran = { desde?: string; hasta?: string; conductor?: string; obra?: string; cliente?: string; matricula?: string };

const esc = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);

export function albaranesQuery(f: FiltrosAlbaran, limit = 200) {
  const w: SQL[] = [];
  const d = inicioDia(f.desde);
  const h = finDia(f.hasta);
  if (d !== null) w.push(gte(albaranes.fechaHora, d));
  if (h !== null) w.push(lte(albaranes.fechaHora, h));
  if (f.conductor) w.push(eq(albaranes.conductorId, f.conductor));
  if (f.obra) w.push(like(albaranes.obra, `%${esc(f.obra)}%`));
  if (f.cliente) w.push(like(albaranes.cliente, `%${esc(f.cliente)}%`));
  if (f.matricula) w.push(like(albaranes.matricula, `%${esc(f.matricula.toUpperCase().replace(/[\s.-]+/g, ''))}%`));
  return db
    .select({
      id: albaranes.id, fechaHora: albaranes.fechaHora, obra: albaranes.obra, cliente: albaranes.cliente,
      lat: albaranes.lat, lng: albaranes.lng, estadoSync: albaranes.estadoSync, conductor: users.name,
      matricula: albaranes.matricula, numero: albaranes.numero, material: albaranes.material, cantidad: albaranes.cantidad, leidoIa: albaranes.leidoIa,
      tieneFoto: albaranes.fotoUrl, fotoKey: albaranes.fotoKey,
    })
    .from(albaranes)
    .innerJoin(users, eq(users.id, albaranes.conductorId))
    .where(w.length ? and(...w) : undefined)
    .orderBy(desc(albaranes.fechaHora))
    .limit(limit);
}
