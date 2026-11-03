import { totalum } from 'totalum-sdk';

import { albaranesQuery } from '@/lib/albaranes-query';
import { fmtFechaHora } from '@/lib/fechas';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

const h = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// Exporta los albaranes filtrados a Excel (.xls) o PDF. Solo oficina.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const f = { desde: sp.get('desde') ?? '', hasta: sp.get('hasta') ?? '', conductor: sp.get('conductor') ?? '', obra: sp.get('obra') ?? '', cliente: sp.get('cliente') ?? '' };
  const { user, data } = await loadPage((me) => [perfilQuery(me), albaranesQuery(f, 1000)], { signedIn: true });
  if (!user) return new Response('Inicia sesión', { status: 401 });
  if (!esOficina(rolDe(user, data[0]))) return new Response('Sin permiso', { status: 403 });
  const rows = data[1];
  const head = ['Fecha y hora', 'Conductor', 'Obra', 'Cliente', 'Estado', 'Ubicación'];
  const body = rows
    .map((r) => [fmtFechaHora(r.fechaHora), r.conductor ?? '', r.obra, r.cliente, r.estadoSync, r.lat != null && r.lng != null ? `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}` : ''])
    .map((c) => `<tr>${c.map((x) => `<td>${h(x)}</td>`).join('')}</tr>`)
    .join('');
  const table = `<table border="1" cellspacing="0" cellpadding="5"><thead><tr>${head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
  const fecha = new Date().toISOString().slice(0, 10);
  if (sp.get('formato') === 'pdf') {
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11px;color:#222}h1{font-size:18px}table{border-collapse:collapse;width:100%}th{background:#e8590c;color:#fff;text-align:left}th,td{border:1px solid #bbb;padding:5px}</style></head><body><h1>Albaranes (${rows.length})</h1><p>Generado el ${fmtFechaHora(Date.now())}</p>${table}</body></html>`;
    try {
      const pdf = await totalum.pdf.fromHtml({ name: `albaranes-${fecha}`, html, options: { format: 'A4', landscape: true, printBackground: true } });
      return Response.redirect(pdf.url, 302);
    } catch (err) {
      console.error('export pdf', err);
      return new Response('No se pudo generar el PDF', { status: 502 });
    }
  }
  const xls = `<html><head><meta charset="utf-8"></head><body>${table}</body></html>`;
  return new Response('﻿' + xls, {
    headers: { 'content-type': 'application/vnd.ms-excel; charset=utf-8', 'content-disposition': `attachment; filename="albaranes-${fecha}.xls"` },
  });
}
