import { desc, eq, isNotNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { albaranes, fichajes, users } from '@/db/schema';
import { Card } from '@/components/ui';
import { fmtFechaHora } from '@/lib/fechas';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';
import { Mapa, type Punto } from './mapa';

export const metadata = { title: 'Mapa de conductores' };

export default async function Page() {
  const { user, data } = await loadPage(
    (me) => [
      perfilQuery(me),
      db.select({ id: fichajes.usuarioId, nombre: users.name, lat: fichajes.lat, lng: fichajes.lng, t: fichajes.fechaHora }).from(fichajes).innerJoin(users, eq(users.id, fichajes.usuarioId)).where(isNotNull(fichajes.lat)).orderBy(desc(fichajes.fechaHora)).limit(300),
      db.select({ id: albaranes.conductorId, nombre: users.name, lat: albaranes.lat, lng: albaranes.lng, t: albaranes.fechaHora }).from(albaranes).innerJoin(users, eq(users.id, albaranes.conductorId)).where(isNotNull(albaranes.lat)).orderBy(desc(albaranes.fechaHora)).limit(300),
    ],
    { signedIn: true },
  );
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  const ult = new Map<string, Punto & { t: number }>();
  for (const [rows, origen] of [[data[1], 'Fichaje'], [data[2], 'Albarán']] as const)
    for (const r of rows) {
      const prev = ult.get(r.id);
      if (r.lat == null || r.lng == null || (prev && prev.t >= r.t)) continue;
      ult.set(r.id, { nombre: r.nombre ?? 'Sin nombre', lat: r.lat, lng: r.lng, t: r.t, cuando: fmtFechaHora(r.t), origen });
    }
  const puntos = [...ult.values()].sort((a, b) => b.t - a.t);
  return (
    <Marco actual="/oficina/mapa" description="Última ubicación conocida de cada conductor (de su último fichaje o albarán con GPS)." title="Mapa">
      <Mapa puntos={puntos} />
      <Card title="Últimas ubicaciones">
        {puntos.length === 0 ? <p>Todavía no hay ubicaciones registradas.</p> : (
          <ul className="grid gap-2 text-sm">
            {puntos.map((p) => <li key={p.nombre}><b>{p.nombre}</b> · {p.origen} · {p.cuando}</li>)}
          </ul>
        )}
      </Card>
    </Marco>
  );
}
