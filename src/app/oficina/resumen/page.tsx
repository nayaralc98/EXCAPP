import { redirect } from 'next/navigation';

import { users } from '@/db/schema';
import { db } from '@/db';
import { button, EmptyState, input } from '@/components/ui';
import { consultaAlbaranesMes, rangoMes, resumenObras } from '@/lib/informes';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Resumen mensual por obra' };

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const r = rangoMes((await searchParams).mes);
  const { user, data } = await loadPage(
    (me) => [perfilQuery(me), consultaAlbaranesMes(r), db.select({ id: users.id, name: users.name, email: users.email }).from(users).limit(500)],
    { signedIn: true },
  );
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  const nombres = new Map(data[2].map((u) => [u.id, u.name || u.email]));
  const filas = resumenObras(data[1], nombres);
  return (
    <Marco
      action={
        <div className="flex gap-2">
          <a className={button.secondary} href={`/api/export?tipo=resumen&formato=pdf&mes=${r.mes}`}>Exportar PDF</a>
          <a className={button.primary} href={`/api/export?tipo=resumen&formato=xlsx&mes=${r.mes}`}>Exportar Excel</a>
        </div>
      }
      actual="/oficina/resumen"
      description="Albaranes, conductores y días de trabajo de cada obra en el mes."
      title="Resumen mensual por obra"
    >
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4" method="get">
        <label className="text-sm font-medium">Mes<input className={input} defaultValue={r.mes} name="mes" type="month" /></label>
        <button className={button.primary} type="submit">Ver</button>
      </form>
      {filas.length === 0 ? (
        <EmptyState title="No hay albaranes en este mes" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
              <tr><th className="px-4 py-3">Obra</th><th className="px-4 py-3">Albaranes</th><th className="hidden px-4 py-3 sm:table-cell">Conductores</th><th className="hidden px-4 py-3 sm:table-cell">Días</th><th className="hidden px-4 py-3 md:table-cell">Materiales</th></tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr className="border-t border-zinc-100" key={`${f.obra}|${f.cliente}`}>
                  <td className="px-4 py-2"><b>{f.obra}</b><div className="text-xs text-zinc-500">{f.cliente}</div></td>
                  <td className="px-4 py-2 text-lg font-bold">{f.albaranes}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{f.conductores}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{f.dias}</td>
                  <td className="hidden px-4 py-2 md:table-cell">{f.materiales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Marco>
  );
}
