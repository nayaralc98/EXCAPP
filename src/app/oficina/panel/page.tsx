import { redirect } from 'next/navigation';

import { Badge, button, EmptyState, input, Stat } from '@/components/ui';
import { fmtFechaHora } from '@/lib/fechas';
import { loadPage } from '@/lib/load-page';
import { calcularPanel, consultasPanel, fmtMin, fmtNum, hoyMadrid, rangoDias } from '@/lib/panel';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Panel de control' };

const etiquetaInc: Record<string, string> = { averia: 'Avería', espera: 'Espera', repostaje: 'Repostaje', otro: 'Otro' };
const tonoInc: Record<string, 'red' | 'amber' | 'blue' | 'gray'> = { averia: 'red', espera: 'amber', repostaje: 'blue' };

export default async function Page({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const sp = await searchParams;
  const r = rangoDias(sp.desde, sp.hasta);
  const { user, data } = await loadPage((me) => [perfilQuery(me), ...consultasPanel(r)], { signedIn: true });
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  const [, alb, fic, inc, us] = data;
  const nombres = new Map(us.map((u) => [u.id, u.name || u.email]));
  const { filas, total } = calcularPanel(alb, fic, inc, nombres, r);
  const unDia = r.desdeTxt === r.hastaTxt;
  const esHoy = unDia && r.desdeTxt === hoyMadrid();
  const porTipo = new Map<string, number>();
  for (const i of inc) porTipo.set(i.tipo, (porTipo.get(i.tipo) ?? 0) + 1);
  const maxViajes = Math.max(1, ...filas.map((f) => f.viajes));

  return (
    <Marco
      actual="/oficina/panel"
      description={esHoy ? 'Actividad de hoy en tiempo real.' : unDia ? `Actividad del ${r.desdeTxt}.` : `Actividad del ${r.desdeTxt} al ${r.hastaTxt}.`}
      title="Panel de control"
    >
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4" method="get">
        <label className="text-sm font-medium">Desde<input className={input} defaultValue={r.desdeTxt} name="desde" type="date" /></label>
        <label className="text-sm font-medium">Hasta<input className={input} defaultValue={r.hastaTxt} name="hasta" type="date" /></label>
        <button className={button.primary} type="submit">Ver</button>
        <a className={button.secondary} href="/oficina/panel">Hoy</a>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat hint={`${total.conductores} conductores activos`} label="Albaranes" value={alb.length} />
        <Stat hint={[...porTipo].map(([t, n]) => `${etiquetaInc[t] ?? t}: ${n}`).join(' · ') || 'Sin incidencias'} label={esHoy ? 'Incidencias del día' : 'Incidencias'} value={inc.length} />
        <Stat hint={`${fmtNum(total.viajesPorConductor)} viajes por conductor`} label="Rendimiento" value={total.viajesHora == null ? '—' : `${fmtNum(total.viajesHora, 2)} viajes/h`} />
        <Stat hint={`Entre viajes: ${fmtMin(total.minEntreViajes)}`} label="Tiempo medio por viaje" value={fmtMin(total.minPorViaje)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Horas fichadas" value={fmtMin(total.minutos || null)} />
        <Stat hint="Diferencia de km entre entrada y salida" label="Km recorridos" value={total.km == null ? '—' : `${fmtNum(total.km, 0)} km`} />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-100 px-4 py-3 text-base font-bold">Viajes y rendimiento por conductor</h2>
        {filas.length === 0 ? (
          <EmptyState text="Cuando los conductores fichen y fotografíen albaranes aparecerán aquí." title="Sin actividad en estas fechas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Conductor</th>
                  <th className="px-4 py-3">Viajes</th>
                  <th className="px-4 py-3">Horas</th>
                  <th className="px-4 py-3">Viajes/h</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Tiempo medio/viaje</th>
                  <th className="hidden px-4 py-3 md:table-cell">Entre viajes</th>
                  <th className="hidden px-4 py-3 md:table-cell">Km</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Km/viaje</th>
                  <th className="px-4 py-3">Incid.</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr className="border-t border-zinc-100" key={f.id}>
                    <td className="px-4 py-2 font-bold">{f.nombre}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-lg font-bold tabular-nums">{f.viajes}</span>
                        <span aria-hidden className="hidden h-2 rounded-full bg-brand sm:block" style={{ width: `${(f.viajes / maxViajes) * 80}px` }} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">{f.turnos ? fmtMin(f.minutos) : <Badge tone="amber">Sin fichar</Badge>}</td>
                    <td className="px-4 py-2 tabular-nums">{fmtNum(f.viajesHora, 2)}</td>
                    <td className="hidden whitespace-nowrap px-4 py-2 sm:table-cell">{fmtMin(f.minPorViaje)}</td>
                    <td className="hidden whitespace-nowrap px-4 py-2 md:table-cell">{fmtMin(f.minEntreViajes)}</td>
                    <td className="hidden px-4 py-2 tabular-nums md:table-cell">{fmtNum(f.km, 0)}</td>
                    <td className="hidden px-4 py-2 tabular-nums lg:table-cell">{fmtNum(f.kmPorViaje)}</td>
                    <td className="px-4 py-2">{f.incidencias ? <Badge tone="red">{f.incidencias}</Badge> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
          Viaje = albarán fotografiado. Rendimiento = viajes por hora fichada. Tiempo medio/viaje = horas fichadas ÷ viajes. Entre viajes = media de tiempo entre
          albaranes seguidos del mismo día (sin contar pausas de más de 4 h). Km = km de salida − km de entrada de cada jornada.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-100 px-4 py-3 text-base font-bold">Incidencias</h2>
        {inc.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">No hay incidencias en estas fechas.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {inc.slice().reverse().map((i) => (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm" key={i.id}>
                <Badge tone={tonoInc[i.tipo] ?? 'gray'}>{etiquetaInc[i.tipo] ?? i.tipo}</Badge>
                <span className="font-bold">{i.nombre || i.email}</span>
                <span className="text-zinc-500">{fmtFechaHora(i.fechaHora)}</span>
                {i.litros != null && <span>{fmtNum(i.litros)} L</span>}
                {i.importe != null && <span>{fmtNum(i.importe, 2)} €</span>}
                {i.comentario && <span className="w-full text-zinc-700">{i.comentario}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Marco>
  );
}
