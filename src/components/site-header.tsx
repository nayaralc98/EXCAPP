import Link from 'next/link';

import { SignOutButton } from '@/components/sign-out-button';
import { currentSession } from '@/lib/auth';
import { hasShell, site } from '@/lib/site';

const link =
  'rounded-md px-3 py-3 text-base font-bold text-zinc-800 transition-colors hover:bg-zinc-100 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40 md:py-2 md:text-sm';

// La cabecera de todas las rutas (la pinta layout.tsx): enlaces en `src/lib/site.ts`. Compacta: h-16 también en móvil.
export async function SiteHeader() {
  if (!hasShell()) return null;
  const session = site.accounts ? await currentSession({ admin: false }) : null;
  const links = session ? [...site.nav, ...site.appNav] : site.nav;
  const items = (
    <>
      {links.map((l) => (
        <Link className={link} href={l.href} key={l.href}>
          {l.label}
        </Link>
      ))}
      {!site.accounts ? null : session ? (
        <SignOutButton className={`${link} text-left`} />
      ) : (
        <>
          <Link className={link} href="/login">
            Entrar
          </Link>
          <Link
            className="rounded-md bg-brand px-4 py-3 text-center text-base font-bold text-white transition-colors hover:bg-orange-800 focus-visible:ring-2 focus-visible:ring-brand/40 md:py-2 md:text-sm"
            href="/register"
          >
            Crear cuenta
          </Link>
        </>
      )}
    </>
  );
  return (
    <header className="sticky top-0 z-20 border-b-4 border-brand bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link className="flex min-w-0 items-center gap-2.5 font-display text-lg font-extrabold tracking-tight" href="/">
          {site.logo ? (
            <img alt="" className="h-9 w-auto" src={site.logo} />
          ) : (
            <span aria-hidden className="relative size-7 shrink-0 bg-brand">
              <span className="absolute bottom-0 right-0 size-3.5 bg-accent [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
            </span>
          )}
          <span className="truncate">{site.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{items}</nav>
        <details className="relative md:hidden">
          <summary
            aria-label="Menú"
            className="grid size-11 cursor-pointer list-none place-items-center rounded-md bg-zinc-900 text-white [&::-webkit-details-marker]:hidden"
          >
            <svg aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="square" />
            </svg>
          </summary>
          <nav className="absolute right-0 mt-3 grid w-64 gap-1 rounded-lg border-2 border-zinc-900 bg-white p-2 shadow-xl">
            {items}
          </nav>
        </details>
      </div>
    </header>
  );
}
