import { redirect } from 'next/navigation';

import { Badge, button, EmptyState, input } from '@/components/ui';
import { consultaFichajesMes, fmtHoras, horasPorTrabajador, rangoMes } from '@/lib/informes';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Horas por conductor' };

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const r = rangoMes((await searchParams).mes);
  const { user, data } = await loadPage((me) => [perfilQuery(me), consultaFichajesMes(r)], { signedIn: true });
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  const filas = horasPorTrabajador(data[1]);
  return (
    <Marco
      action={
        <div className="flex gap-2">
          <a className={button.secondary} href={`/api/export?tipo=horas&formato=pdf&mes=${r.mes}`}>Exportar PDF</a>
          <a className={button.primary} href={`/api/export?tipo=horas&formato=xlsx&mes=${r.mes}`}>Exportar Excel</a>
        </div>
      }
      actual="/oficina/horas"
      description="Horas trabajadas según las entradas y salidas fichadas."
      title="Horas por conductor"
    >
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4" method="get">
        <label className="text-sm font-medium">Mes<input className={input} defaultValue={r.mes} name="mes" type="month" /></label>
        <button className={button.primary} type="submit">Ver</button>
      </form>
      {filas.length === 0 ? (
        <EmptyState title="No hay fichajes en este mes" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
              <tr><th className="px-4 py-3">Trabajador</th><th className="px-4 py-3">Horas</th><th className="hidden px-4 py-3 sm:table-cell">Días</th><th className="hidden px-4 py-3 sm:table-cell">Turnos</th><th className="px-4 py-3">Sin salida</th></tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr className="border-t border-zinc-100" key={f.nombre}>
                  <td className="px-4 py-2 font-bold">{f.nombre}</td>
                  <td className="px-4 py-2 text-lg font-bold">{fmtHoras(f.minutos)}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{f.dias}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{f.turnos}</td>
                  <td className="px-4 py-2">{f.abiertos ? <Badge tone="amber">{f.abiertos}</Badge> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Marco>
  );
}
