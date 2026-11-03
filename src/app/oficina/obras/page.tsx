import { asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { obras } from '@/db/schema';
import { button, Card, input } from '@/components/ui';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Obras' };

async function anadir(form: FormData) {
  'use server';
  const { user, data } = await loadPage((me) => [perfilQuery(me)], { signedIn: true });
  if (!user || !esOficina(rolDe(user, data[0]))) return;
  const nombre = String(form.get('nombre') ?? '').trim().slice(0, 120);
  const cliente = String(form.get('cliente') ?? '').trim().slice(0, 120);
  if (!nombre || !cliente) return;
  await db.insert(obras).values({ id: crypto.randomUUID(), nombre, cliente });
  revalidatePath('/oficina/obras');
}

export default async function Page() {
  const { user, data } = await loadPage((me) => [perfilQuery(me), db.select().from(obras).orderBy(asc(obras.nombre)).limit(200)], { signedIn: true });
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  return (
    <Marco actual="/oficina/obras" description="Las obras que los conductores pueden elegir al fotografiar un albarán." title="Obras">
      <Card title="Añadir obra">
        <form action={anadir} className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">Nombre de la obra<input className={input} name="nombre" required /></label>
          <label className="text-sm font-medium">Cliente<input className={input} name="cliente" required /></label>
          <div className="flex items-end"><button className={button.primary} type="submit">Añadir</button></div>
        </form>
      </Card>
      <Card title={`Obras (${data[1].length})`}>
        <ul className="divide-y divide-zinc-100">
          {data[1].map((o) => <li className="py-2" key={o.id}><b>{o.nombre}</b> <span className="text-zinc-600">· {o.cliente}</span></li>)}
        </ul>
      </Card>
    </Marco>
  );
}
