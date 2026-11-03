import Link from 'next/link';

import { AppPage, Card } from '@/components/ui';
import type { Rol } from '@/lib/roles';

const tabs = [
  { href: '/oficina', label: 'Albaranes' },
  { href: '/oficina/fichajes', label: 'Fichajes' },
  { href: '/oficina/mapa', label: 'Mapa' },
  { href: '/oficina/obras', label: 'Obras' },
  { href: '/oficina/equipo', label: 'Equipo' },
];

/** Marco común de las pantallas de oficina: título, pestañas y contenido. */
export function Marco(props: { actual: string; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; rol?: Rol }) {
  return (
    <AppPage action={props.action} description={props.description} title={props.title}>
      <nav className="-mb-2 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            className={`rounded-lg px-4 py-2 text-sm font-bold ${t.href === props.actual ? 'bg-zinc-900 text-white' : 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100'}`}
            href={t.href}
            key={t.href}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {props.children}
    </AppPage>
  );
}

export function SinPermiso() {
  return (
    <AppPage title="Zona de oficina">
      <Card>
        <p>Esta zona es para administrativos y gerentes. Si eres conductor, usa la app del móvil.</p>
        <Link className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 font-bold text-white" href="/app">
          Ir a la app del conductor
        </Link>
      </Card>
    </AppPage>
  );
}
