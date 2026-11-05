import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/db';
import { perfiles, users } from '@/db/schema';
import { button, Card } from '@/components/ui';
import { loadPage } from '@/lib/load-page';
import { esOficina, etiquetaRol, perfilQuery, rolDe, ROLES, type Rol } from '@/lib/roles';

import { Marco, SinPermiso } from '../pestanas';

export const metadata = { title: 'Equipo' };

async function cambiarRol(form: FormData) {
  'use server';
  const { user, data } = await loadPage((me) => [perfilQuery(me)], { signedIn: true });
  if (!user || rolDe(user, data[0]) !== 'gerente') return;
  const id = String(form.get('id') ?? '');
  const rol = String(form.get('rol') ?? '') as Rol;
  if (!id || !ROLES.includes(rol)) return;
  await db
    .insert(perfiles)
    .values({ userId: id, rol, updatedAt: Date.now() })
    .onConflictDoUpdate({ target: perfiles.userId, set: { rol, updatedAt: Date.now() } });
  revalidatePath('/oficina/equipo');
}

export default async function Page() {
  const { user, data } = await loadPage(
    (me) => [
      perfilQuery(me),
      db.select({ id: users.id, name: users.name, email: users.email, rol: perfiles.rol }).from(users).leftJoin(perfiles, eq(perfiles.userId, users.id)).orderBy(asc(users.name)).limit(200),
    ],
    { signedIn: true },
  );
  if (!user) redirect('/login');
  const rol = rolDe(user, data[0]);
  if (!esOficina(rol)) return <SinPermiso />;
  return (
    <Marco actual="/oficina/equipo" description="Quien se registra entra como conductor; el gerente puede cambiar su rol." title="Equipo">
      <Card>
        <ul className="divide-y divide-zinc-100">
          {data[1].map((u) => {
            const actual = (u.rol as Rol) ?? 'conductor';
            return (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={u.id}>
                <div className="min-w-0">
                  <p className="font-bold">{u.name || u.email}</p>
                  <p className="truncate text-sm text-zinc-600">{u.email}</p>
                </div>
                {rol === 'gerente' ? (
                  <form action={cambiarRol} className="flex gap-2">
                    <input name="id" type="hidden" value={u.id} />
                    <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" defaultValue={actual} name="rol">
                      {ROLES.map((r) => <option key={r} value={r}>{etiquetaRol[r]}</option>)}
                    </select>
                    <button className={button.secondary} type="submit">Guardar</button>
                  </form>
                ) : (
                  <span className="text-sm font-bold">{etiquetaRol[actual]}</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </Marco>
  );
}
