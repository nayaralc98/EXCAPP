import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { vehiculos } from '@/db/schema';
import { button, Card, input } from '@/components/ui';
import { normMatricula } from '@/lib/leer-albaran';
import { loadPage } from '@/lib/load-page';
import { esOficina, perfilQuery, rolDe } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Máquinas y camiones' };

async function anadir(form: FormData) {
  'use server';
  const { user, data } = await loadPage((me) => [perfilQuery(me)], { signedIn: true });
  if (!user || !esOficina(rolDe(user, data[0]))) return;
  const matricula = normMatricula(String(form.get('matricula') ?? ''));
  const nombre = String(form.get('nombre') ?? '').trim().slice(0, 80);
  const tipo = String(form.get('tipo') ?? 'camión').trim().slice(0, 40) || 'camión';
  if (!matricula) return;
  await db.insert(vehiculos).values({ id: crypto.randomUUID(), matricula, nombre, tipo }).onConflictDoNothing();
  revalidatePath('/oficina/vehiculos');
}

async function quitar(form: FormData) {
  'use server';
  const { user, data } = await loadPage((me) => [perfilQuery(me)], { signedIn: true });
  if (!user || !esOficina(rolDe(user, data[0]))) return;
  await db.delete(vehiculos).where(eq(vehiculos.id, String(form.get('id') ?? '')));
  revalidatePath('/oficina/vehiculos');
}

export default async function Page() {
  const { user, data } = await loadPage((me) => [perfilQuery(me), db.select().from(vehiculos).orderBy(asc(vehiculos.nombre)).limit(300)], { signedIn: true });
  if (!user) redirect('/login');
  if (!esOficina(rolDe(user, data[0]))) return <SinPermiso />;
  return (
    <Marco actual="/oficina/vehiculos" description="Las máquinas y camiones que los conductores pueden elegir al fotografiar un albarán." title="Máquinas y camiones">
      <Card title="Añadir máquina o camión">
        <form action={anadir} className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm font-medium">Matrícula<input className={input} name="matricula" required /></label>
          <label className="text-sm font-medium">Nombre<input className={input} name="nombre" placeholder="Volquete 1" /></label>
          <label className="text-sm font-medium">Tipo<input className={input} defaultValue="camión" name="tipo" /></label>
          <div className="flex items-end"><button className={button.primary} type="submit">Añadir</button></div>
        </form>
      </Card>
      <Card title={`Flota (${data[1].length})`}>
        <ul className="divide-y divide-zinc-100">
          {data[1].map((v) => (
            <li className="flex items-center justify-between py-2" key={v.id}>
              <span><b>{v.matricula}</b> <span className="text-zinc-600">· {v.nombre} · {v.tipo}</span></span>
              <form action={quitar}><input name="id" type="hidden" value={v.id} /><button className="text-sm font-bold text-red-700" type="submit">Quitar</button></form>
            </li>
          ))}
        </ul>
      </Card>
    </Marco>
  );
}
