import { and, asc, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { fichajes, users } from '@/db/schema';
import { Badge, button, EmptyState, input } from '@/components/ui';
import { finDia, fmtFechaHora, inicioDia } from '@/lib/fechas';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Fichajes' };
const tono = { pendiente: 'amber', sincronizado: 'green', error: 'red' } as const;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const w: SQL[] = [];
  const d = inicioDia(sp.desde);
  const h = finDia(sp.hasta);
  if (d !== null) w.push(gte(fichajes.fechaHora, d));
  if (h !== null) w.push(lte(fichajes.fechaHora, h));
  if (sp.trabajador) w.push(eq(fichajes.usuarioId, sp.trabajador));
  const { user, data } = await loadPage(
    (me) => [
      perfilQuery(me),
      db
        .select({ id: fichajes.id, tipo: fichajes.tipo, fechaHora: fichajes.fechaHora, lat: fichajes.lat, lng: fichajes.lng, estado: fichajes.estadoSync, nombre: users.name })
        .from(fichajes)
        .innerJoin(users, eq(users.id, fichajes.usuarioId))
        .where(w.length ? and(...w) : undefined)
        .orderBy(desc(fichajes.fechaHora))
        .limit(300),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.name)).limit(200),
    ],
    { signedIn: true },
  );
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  const rows = data[1];
  return (
    <Marco actual="/oficina/fichajes" description="Entradas y salidas de cada trabajador." title="Historial de fichajes">
      <form className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" method="get">
        <label className="text-sm font-medium">Trabajador
          <select className={input} defaultValue={sp.trabajador ?? ''} name="trabajador">
            <option value="">Todos</option>
            {data[2].map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Desde<input className={input} defaultValue={sp.desde} name="desde" type="date" /></label>
        <label className="text-sm font-medium">Hasta<input className={input} defaultValue={sp.hasta} name="hasta" type="date" /></label>
        <div className="flex items-end gap-2">
          <button className={button.primary} type="submit">Filtrar</button>
          <a className={button.secondary} href="/oficina/fichajes">Limpiar</a>
        </div>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No hay fichajes con estos filtros" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
              <tr><th className="px-4 py-3">Trabajador</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Fecha y hora</th><th className="hidden px-4 py-3 sm:table-cell">Ubicación</th><th className="px-4 py-3">Estado</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="border-t border-zinc-100" key={r.id}>
                  <td className="px-4 py-2">{r.nombre}</td>
                  <td className="px-4 py-2"><Badge tone={r.tipo === 'entrada' ? 'blue' : 'gray'}>{r.tipo === 'entrada' ? 'Entrada' : 'Salida'}</Badge></td>
                  <td className="px-4 py-2 whitespace-nowrap">{fmtFechaHora(r.fechaHora)}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{r.lat != null && r.lng != null ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : 'Sin GPS'}</td>
                  <td className="px-4 py-2"><Badge tone={tono[r.estado as keyof typeof tono] ?? 'gray'}>{r.estado}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Marco>
  );
}
