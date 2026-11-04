import { totalum } from 'totalum-sdk';

import { db } from '@/db';
import { users } from '@/db/schema';
import { albaranesQuery } from '@/lib/albaranes-query';
import { fmtFechaHora } from '@/lib/fechas';
import { consultaAlbaranesMes, consultaFichajesMes, fmtHoras, horasPorTrabajador, rangoMes, resumenObras } from '@/lib/informes';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';
import { crearXlsx, type Celda } from '@/lib/xlsx';

const h = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// Exporta albaranes, horas o resumen por obra a Excel (.xlsx) o PDF. Solo oficina.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const tipo = sp.get('tipo') === 'horas' ? 'horas' : sp.get('tipo') === 'resumen' ? 'resumen' : 'albaranes';
  const f = { desde: sp.get('desde') ?? '', hasta: sp.get('hasta') ?? '', conductor: sp.get('conductor') ?? '', obra: sp.get('obra') ?? '', cliente: sp.get('cliente') ?? '', matricula: sp.get('matricula') ?? '' };
  const r = rangoMes(sp.get('mes') ?? undefined);
  const { user, data } = await loadPage(
    (me) => [
      perfilQuery(me),
      tipo === 'albaranes' ? albaranesQuery(f, 1000) : tipo === 'horas' ? consultaFichajesMes(r) : consultaAlbaranesMes(r),
      db.select({ id: users.id, name: users.name, email: users.email }).from(users).limit(500),
    ],
    { signedIn: true },
  );
  if (!user) return new Response('Inicia sesión', { status: 401 });
  if (!esOficina(rolDe(user, data[0]))) return new Response('Sin permiso', { status: 403 });

  let titulo: string;
  let head: string[];
  let body: Celda[][];
  if (tipo === 'albaranes') {
    const rows = data[1] as Awaited<ReturnType<typeof albaranesQuery>>;
    titulo = `Albaranes (${rows.length})`;
    head = ['Fecha y hora', 'Conductor', 'Obra', 'Cliente', 'Matrícula', 'Nº albarán', 'Material', 'Cantidad', 'Ubicación'];
    body = rows.map((x) => [fmtFechaHora(x.fechaHora), x.conductor ?? '', x.obra, x.cliente, x.matricula, x.numero, x.material, x.cantidad, x.lat != null && x.lng != null ? `${x.lat.toFixed(5)}, ${x.lng.toFixed(5)}` : '']);
  } else if (tipo === 'horas') {
    titulo = `Horas por conductor · ${r.mes}`;
    head = ['Trabajador', 'Horas', 'Horas (decimal)', 'Días', 'Turnos', 'Entradas sin salida'];
    body = horasPorTrabajador(data[1] as Parameters<typeof horasPorTrabajador>[0]).map((x) => [x.nombre, fmtHoras(x.minutos), Math.round((x.minutos / 60) * 100) / 100, x.dias, x.turnos, x.abiertos]);
  } else {
    titulo = `Resumen por obra · ${r.mes}`;
    head = ['Obra', 'Cliente', 'Albaranes', 'Conductores', 'Días', 'Materiales'];
    const nombres = new Map(data[2].map((u) => [u.id, u.name || u.email]));
    body = resumenObras(data[1] as Parameters<typeof resumenObras>[0], nombres).map((x) => [x.obra, x.cliente, x.albaranes, x.conductores, x.dias, x.materiales]);
  }
  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = `${tipo}-${tipo === 'albaranes' ? fecha : r.mes}`;

  if (sp.get('formato') === 'pdf') {
    const filas = body.map((c) => `<tr>${c.map((x) => `<td>${h(x)}</td>`).join('')}</tr>`).join('');
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11px;color:#222}h1{font-size:18px}table{border-collapse:collapse;width:100%}th{background:#e8590c;color:#fff;text-align:left}th,td{border:1px solid #bbb;padding:5px}</style></head><body><h1>${h(titulo)}</h1><p>Generado el ${fmtFechaHora(Date.now())}</p><table><thead><tr>${head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table></body></html>`;
    try {
      const pdf = await totalum.pdf.fromHtml({ name: nombre, html, options: { format: 'A4', landscape: true, printBackground: true } });
      return Response.redirect(pdf.url, 302);
    } catch (err) {
      console.error('export pdf', err);
      return new Response('No se pudo generar el PDF', { status: 502 });
    }
  }
  const bytes = crearXlsx([{ nombre: titulo.slice(0, 31), filas: [head, ...body] }]);
  return new Response(bytes as BodyInit, {
    headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': `attachment; filename="${nombre}.xlsx"` },
  });
}
