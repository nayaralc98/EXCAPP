import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Presentación | EXCAPP',
  description: 'Presentación comercial de EXCAPP: albaranes y fichajes desde el móvil para transporte y movimiento de tierras.',
};

const slide = 'presentacion-slide flex min-h-screen flex-col justify-center px-6 py-16 sm:px-12 lg:px-24 break-after-page';

const problemas = [
  ['Albaranes en papel', 'Se pierden, se arrugan o llegan tarde a la oficina. Facturar se retrasa.'],
  ['Horas a mano', 'Los partes de horas se apuntan en papel y se pasan a Excel a final de mes.'],
  ['Sin saber qué pasa en obra', 'La oficina no ve qué máquina está en qué obra hasta que llega el papel.'],
];

const pasos = [
  ['1', 'El conductor hace una foto', 'Elige obra y máquina y pulsa un botón grande. Funciona sin cobertura y se sube solo cuando hay señal.'],
  ['2', 'La IA lee el albarán', 'Detecta número, matrícula, material y cantidad. Se acabó teclear.'],
  ['3', 'La oficina lo tiene al instante', 'Filtra, ve la foto, exporta a PDF o Excel y factura sin perseguir papeles.'],
];

const funciones = [
  ['Interfaz de obra', 'Botones grandes, alto contraste, legible a pleno sol y en pocos pasos.'],
  ['Funciona sin cobertura', 'Guarda en el móvil y sincroniza después. No se pierde nada.'],
  ['Fichaje con ubicación', 'Entrada y salida desde el móvil, con hora y posición.'],
  ['Lectura con IA', 'Extrae los datos del albarán desde la foto.'],
  ['Horas por trabajador', 'Resumen mensual listo para nóminas.'],
  ['Resumen por obra', 'Albaranes y material por obra y mes, para facturar.'],
  ['Mapa de actividad', 'Dónde se ha hecho cada albarán y cada fichaje.'],
  ['Exporta a PDF y Excel', 'Informes listos para enviar al cliente o a la gestoría.'],
  ['Avisos por e-mail', 'Resumen diario automático a las 8:00.'],
  ['Roles y equipo', 'El gerente gestiona quién ve y qué hace cada persona.'],
];

const beneficios = [
  ['-80 %', 'tiempo de administración de albaranes'],
  ['0', 'papeles perdidos'],
  ['1 día', 'para empezar a usarla'],
  ['100 %', 'en el móvil, sin instalar nada de tienda'],
];

export default function Presentacion() {
  return (
    <main className="bg-zinc-950 text-white print:bg-white print:text-zinc-900">
      <style>{`@media print{header,footer,.no-print{display:none!important}.presentacion-slide{min-height:100vh}}`}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 bg-zinc-900/95 px-4 py-3 text-sm backdrop-blur">
        <span className="font-bold">Presentación EXCAPP</span>
        <span className="text-zinc-400">Para guardar en PDF: Ctrl/⌘ + P</span>
      </div>

      <section className={`${slide} bg-brand`}>
        <p className="text-sm font-bold uppercase tracking-widest text-orange-100">Para transporte y movimiento de tierras</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold leading-tight sm:text-7xl">EXCAPP</h1>
        <p className="mt-6 max-w-2xl text-2xl font-semibold sm:text-3xl">
          Los albaranes y las horas de tu empresa, del camión a la oficina sin papeles.
        </p>
      </section>

      <section className={`${slide} bg-zinc-100 text-zinc-900`}>
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">El problema de cada día</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {problemas.map(([t, d]) => (
            <div key={t} className="rounded-lg border-l-8 border-brand bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-extrabold">{t}</h3>
              <p className="mt-3 text-lg text-zinc-700">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${slide} bg-white text-zinc-900`}>
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">La solución: tres pasos</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pasos.map(([n, t, d]) => (
            <div key={n} className="rounded-lg bg-zinc-100 p-6">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand text-2xl font-extrabold text-white">{n}</span>
              <h3 className="mt-4 text-2xl font-extrabold">{t}</h3>
              <p className="mt-3 text-lg text-zinc-700">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${slide} bg-zinc-900`}>
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Todo lo que incluye</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {funciones.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-zinc-700 p-4">
              <h3 className="text-lg font-bold text-orange-400">{t}</h3>
              <p className="mt-2 text-sm text-zinc-300">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${slide} bg-sand text-zinc-900`}>
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Lo que ganas</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map(([n, d]) => (
            <div key={d} className="rounded-lg bg-white p-6 text-center shadow-sm">
              <p className="font-display text-5xl font-extrabold text-brand">{n}</p>
              <p className="mt-3 text-lg font-semibold">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-zinc-600">Cifras orientativas; ajústalas a tu caso antes de presentarlas.</p>
      </section>

      <section className={`${slide} items-start bg-brand`}>
        <h2 className="max-w-3xl font-display text-4xl font-extrabold sm:text-6xl">¿La probamos en tu empresa?</h2>
        <p className="mt-6 max-w-2xl text-xl">Te la dejamos funcionando con tus obras y tus máquinas. Pide una demo sin compromiso.</p>
        <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="inline-flex min-h-14 items-center rounded-lg bg-white px-7 text-lg font-extrabold text-brand" href="/register">
            Probar ahora
          </Link>
          <Link className="inline-flex min-h-14 items-center rounded-lg border-2 border-white px-7 text-lg font-extrabold" href="/">
            Ver la web
          </Link>
        </div>
      </section>
    </main>
  );
}
