import { asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { users } from '@/db/schema';
import { Badge, button, EmptyState, input } from '@/components/ui';
import { albaranesQuery } from '@/lib/albaranes-query';
import { fmtFechaHora } from '@/lib/fechas';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from './pestanas';
import { Visor } from './visor';

export const metadata = { title: 'Albaranes' };
type SP = Record<string, string | undefined>;
const tono = { pendiente: 'amber', sincronizado: 'green', error: 'red' } as const;

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = { desde: sp.desde, hasta: sp.hasta, conductor: sp.conductor, obra: sp.obra, cliente: sp.cliente };
  const { user, data } = await loadPage(
    (me) => [perfilQuery(me), albaranesQuery(f), db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.name)).limit(200)],
    { signedIn: true },
  );
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  const rows = data[1];
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <Marco
      action={
        <div className="flex gap-2">
          <a className={button.secondary} href={`/api/export?formato=pdf&${qs}`}>Exportar PDF</a>
          <a className={button.primary} href={`/api/export?formato=xls&${qs}`}>Exportar Excel</a>
        </div>
      }
      actual="/oficina"
      description="Filtra por fecha, conductor, obra o cliente y abre la foto original."
      title="Albaranes"
    >
      <form className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <label className="text-sm font-medium">Desde<input className={input} defaultValue={f.desde} name="desde" type="date" /></label>
        <label className="text-sm font-medium">Hasta<input className={input} defaultValue={f.hasta} name="hasta" type="date" /></label>
        <label className="text-sm font-medium">Conductor
          <select className={input} defaultValue={f.conductor ?? ''} name="conductor">
            <option value="">Todos</option>
            {data[2].map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Obra<input className={input} defaultValue={f.obra} name="obra" /></label>
        <label className="text-sm font-medium">Cliente<input className={input} defaultValue={f.cliente} name="cliente" /></label>
        <div className="flex items-end gap-2">
          <button className={button.primary} type="submit">Filtrar</button>
          <a className={button.secondary} href="/oficina">Limpiar</a>
        </div>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="No hay albaranes con estos filtros" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
              <tr>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">Conductor</th>
                <th className="hidden px-4 py-3 sm:table-cell">Obra</th>
                <th className="hidden px-4 py-3 md:table-cell">Cliente</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr className="border-t border-zinc-100" key={r.id}>
                  <td className="px-4 py-2">{r.tieneFoto || r.fotoKey ? <Visor id={r.id} /> : '—'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{fmtFechaHora(r.fechaHora)}
                    <div className="text-xs text-zinc-500 sm:hidden">{r.obra}</div></td>
                  <td className="px-4 py-2">{r.conductor}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{r.obra}</td>
                  <td className="hidden px-4 py-2 md:table-cell">{r.cliente}</td>
                  <td className="px-4 py-2"><Badge tone={tono[r.estadoSync as keyof typeof tono] ?? 'gray'}>{r.estadoSync}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Marco>
  );
}
