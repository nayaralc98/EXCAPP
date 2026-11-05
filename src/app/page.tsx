import Link from 'next/link';

import { currentSession } from '@/lib/auth';

const PHOTO = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
const TRUCK = '1751054631354-a42bd7609d75';
const EARTHWORKS = '1751054619908-65d27a503ce8';
const QUARRY = '1793340626465-6757ef7852de';

const btn =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-lg px-7 text-lg font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand/50';

function Check() {
  return (
    <svg aria-hidden className="mt-0.5 size-6 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="square" />
    </svg>
  );
}

function Actions({ signedIn, tone }: { signedIn: boolean; tone: 'light' | 'brand' }) {
  const onBrand = tone === 'brand';
  const primary = onBrand
    ? 'bg-white text-brand hover:bg-orange-50'
    : 'bg-brand text-white hover:bg-orange-800';
  const secondary = onBrand
    ? 'border-2 border-white text-white hover:bg-white/10'
    : 'border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white';
  return signedIn ? (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link className={`${btn} ${primary}`} href="/app">
        Abrir app del conductor
      </Link>
      <Link className={`${btn} ${secondary}`} href="/oficina">
        Ir a la oficina
      </Link>
    </div>
  ) : (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link className={`${btn} ${primary}`} href="/login">
        Entrar
      </Link>
      <Link className={`${btn} ${secondary}`} href="/register">
        Crear cuenta
      </Link>
    </div>
  );
}

export default async function Home() {
  const session = await currentSession({ admin: false });
  const signedIn = Boolean(session);

  return (
    <main>
      {/* Portada */}
      <section className="relative overflow-hidden bg-zinc-100">
        <div aria-hidden className="absolute -right-32 -top-32 hidden size-[40rem] rounded-full bg-brand lg:block" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7 lg:pr-6">
            <p className="inline-block bg-zinc-900 px-3 py-1.5 text-sm font-bold text-white">
              Transporte y movimiento de tierras
            </p>
            <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl xl:text-[5.5rem]">
              Albaranes y fichajes, <span className="text-brand">sin papel.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-800">
              El conductor fotografía el albarán y ficha desde el móvil, aunque en la obra no haya cobertura. La
              oficina lo consulta, lo organiza y lo exporta desde la web.
            </p>
            <div className="mt-8">
              <Actions signedIn={signedIn} tone="light" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
            <div aria-hidden className="absolute -bottom-4 -left-4 size-40 bg-accent [clip-path:polygon(0_0,100%_100%,0_100%)] sm:size-52" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-tl-[5rem] border-4 border-zinc-900 bg-zinc-300">
              <img
                alt="Camión dumper cargado de tierra avanzando por una explanación de obra"
                className="size-full object-cover object-bottom"
                fetchPriority="high"
                src={PHOTO(TRUCK, 1000)}
              />
            </div>
            {/* La pantalla del conductor: dos botones y nada más */}
            <div className="absolute -bottom-6 -left-2 w-56 rounded-[1.5rem] border-4 border-zinc-900 bg-white p-3 shadow-[6px_6px_0_0_var(--color-brand)] sm:-left-8 sm:w-60">
              <p className="flex items-center gap-2 rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                <span className="size-2 rounded-full bg-amber-600" />
                Sin cobertura
              </p>
              <p className="mt-3 rounded-lg bg-brand px-3 py-4 text-center text-lg font-extrabold text-white">
                Fichar entrada
              </p>
              <p className="mt-2 rounded-lg bg-accent px-3 py-4 text-center text-lg font-extrabold text-white">
                Foto del albarán
              </p>
              <p className="mt-2 text-xs font-bold text-zinc-800">Se guarda en el móvil y se envía al volver la señal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cinta */}
      <div aria-hidden className="hazard h-3" />
      <section className="bg-zinc-950 text-white">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-4 py-6 font-display text-base font-extrabold sm:px-6 md:grid-cols-4 md:text-lg">
          {['Foto del albarán', 'Fichaje en dos toques', 'Funciona sin cobertura', 'Exporta a PDF y Excel'].map((t) => (
            <li className="flex items-center gap-3" key={t}>
              <span aria-hidden className="size-3 shrink-0 bg-brand" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Tres bloques */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="max-w-3xl font-display text-4xl font-black leading-none tracking-tight sm:text-6xl">
          Una jornada, tres piezas que encajan.
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-12">
          <article className="bg-brand p-6 text-white sm:p-10 lg:col-span-7" id="conductores">
            <p className="font-display text-7xl font-black leading-none text-white/30">01</p>
            <h3 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Conductores: foto y fichaje en dos toques
            </h3>
            <p className="mt-4 max-w-xl text-lg leading-8">
              Botones enormes, alto contraste y pocos pasos, para usarla con guantes y a pleno sol. Sin cobertura no
              pasa nada: lo que captures queda guardado en el móvil y se envía cuando vuelva la señal.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <p className="flex items-center gap-4 rounded-lg bg-white p-4 text-xl font-extrabold text-zinc-900">
                <span className="grid size-10 place-items-center bg-zinc-900 text-white">1</span>
                Foto al albarán
              </p>
              <p className="flex items-center gap-4 rounded-lg bg-white p-4 text-xl font-extrabold text-zinc-900">
                <span className="grid size-10 place-items-center bg-zinc-900 text-white">2</span>
                Fichar entrada o salida
              </p>
            </div>
          </article>

          <article className="flex flex-col border-2 border-zinc-900 bg-white lg:col-span-5" id="oficina">
            <div className="aspect-[16/9] overflow-hidden border-b-2 border-zinc-900">
              <img
                alt="Cantera a cielo abierto con maquinaria trabajando en los desmontes"
                className="size-full object-cover"
                loading="lazy"
                src={PHOTO(QUARRY, 800)}
              />
            </div>
            <div className="flex-1 p-6 sm:p-8">
              <p className="font-display text-sm font-extrabold text-brand">02 · Oficina</p>
              <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                Todo lo de la obra, en un panel
              </h3>
              <ul className="mt-5 grid gap-3 text-base leading-6 text-zinc-800">
                {[
                  'Filtra los albaranes y abre la foto de cada uno',
                  'Exporta a PDF y a Excel',
                  'Consulta el historial de fichajes',
                  'Mira en el mapa dónde se ha fichado',
                ].map((t) => (
                  <li className="flex gap-3" key={t}>
                    <Check />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="grid gap-8 bg-accent p-6 text-white sm:p-10 lg:col-span-12 lg:grid-cols-2 lg:items-center" id="instalable">
            <div>
              <p className="font-display text-7xl font-black leading-none text-white/30">03</p>
              <h3 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Se instala en el móvil, sin tiendas de aplicaciones
              </h3>
              <p className="mt-4 max-w-xl text-lg leading-8">
                Se añade a la pantalla de inicio desde el navegador y se abre a pantalla completa, como cualquier
                otra app.
              </p>
            </div>
            <ol className="grid gap-3 text-lg font-bold">
              {[
                'Abre la web en el navegador del móvil.',
                'Elige «Añadir a la pantalla de inicio» en el menú.',
                'Abre la app desde su icono, cada mañana.',
              ].map((t, i) => (
                <li className="flex items-center gap-4 bg-white/10 p-4" key={t}>
                  <span className="grid size-10 shrink-0 place-items-center bg-white font-display font-black text-accent">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      {/* A pleno sol */}
      <section className="relative isolate overflow-hidden bg-zinc-950 text-white">
        <img
          alt="Excavadora y camión trabajando en una explanación de tierra rojiza"
          className="absolute inset-0 -z-20 size-full object-cover"
          loading="lazy"
          src={PHOTO(EARTHWORKS, 1600)}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/40" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-2xl font-display text-4xl font-black leading-none tracking-tight sm:text-6xl">
            Pensada para leerse a pleno sol.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Botones grandes', 'Se pulsan con el pulgar, con guantes y sin buscar.'],
              ['Alto contraste', 'Naranja, azul y negro sobre blanco: legible con el sol de frente.'],
              ['Pocos pasos', 'Foto y fichaje se resuelven en dos toques.'],
            ].map(([t, d]) => (
              <div className="border-l-8 border-brand bg-zinc-950/70 p-5" key={t}>
                <h3 className="font-display text-xl font-extrabold">{t}</h3>
                <p className="mt-2 text-base leading-7 text-zinc-200">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-sand">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-4xl font-black leading-none tracking-tight sm:text-5xl">
              Registro abierto, roles en manos del gerente.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-800">
              Cualquier persona de la empresa puede crear su cuenta y entra como conductor. Después, el gerente
              asigna a cada uno su rol desde la oficina.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-t-8 border-brand bg-white p-6">
              <h3 className="font-display text-xl font-extrabold">Conductor</h3>
              <p className="mt-2 leading-7 text-zinc-800">Abre la app del móvil, ficha y fotografía sus albaranes.</p>
            </div>
            <div className="border-t-8 border-accent bg-white p-6">
              <h3 className="font-display text-xl font-extrabold">Oficina</h3>
              <p className="mt-2 leading-7 text-zinc-800">Consulta, organiza y exporta lo que llega de todas las obras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="relative overflow-hidden bg-brand text-white">
        <div aria-hidden className="absolute -bottom-24 right-0 size-72 bg-accent [clip-path:polygon(100%_0,100%_100%,0_100%)] sm:size-96" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-3xl font-display text-4xl font-black leading-none tracking-tight sm:text-6xl">
            Mañana, el primer albarán sin papel.
          </h2>
          <div className="mt-8">
            <Actions signedIn={signedIn} tone="brand" />
          </div>
        </div>
      </section>
    </main>
  );
}
