import Link from 'next/link';

import { hasShell, site } from '@/lib/site';

// El pie de todas las rutas (lo pinta layout.tsx). Sin teléfono ni dirección: el cliente aún no los ha dado.
export function SiteFooter() {
  if (!hasShell()) return null;
  return (
    <footer className="bg-zinc-950 text-sm text-zinc-300">
      <div aria-hidden className="hazard h-2" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="flex items-center gap-3 font-display text-xl font-extrabold tracking-tight text-white">
            {site.logo ? <img alt="" className="h-8 w-auto" src={site.logo} /> : null}
            {site.name}
          </p>
          <p className="mt-3 max-w-md text-base leading-7">
            Albaranes y fichajes desde el móvil, también sin cobertura. La oficina lo consulta y lo exporta desde la web.
          </p>
        </div>
        <nav className="grid content-start gap-1 text-base font-bold text-white">
          <Link className="py-1.5 transition-colors hover:text-orange-400" href="/login">
            Entrar
          </Link>
          <Link className="py-1.5 transition-colors hover:text-orange-400" href="/register">
            Crear cuenta
          </Link>
          <Link className="py-1.5 transition-colors hover:text-orange-400" href="/app">
            App del conductor
          </Link>
          <Link className="py-1.5 transition-colors hover:text-orange-400" href="/oficina">
            Oficina
          </Link>
        </nav>
      </div>
      <p className="border-t border-zinc-800 px-4 py-4 text-center text-zinc-400 sm:px-6">
        © {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  );
}
