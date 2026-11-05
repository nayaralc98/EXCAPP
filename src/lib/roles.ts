import { eq, type SQL } from 'drizzle-orm';

import { db } from '@/db';
import { perfiles } from '@/db/schema';
import { isAdmin } from '@/lib/admin';

export type Rol = 'conductor' | 'administrativo' | 'gerente';
export const ROLES: Rol[] = ['conductor', 'administrativo', 'gerente'];

/** Consulta del rol guardado de quien ha entrado (para meter en `loadPage`). */
export const perfilQuery = (me: SQL) => db.select({ rol: perfiles.rol }).from(perfiles).where(eq(perfiles.userId, me));

type U = { id?: string; email: string; emailVerified?: boolean | null } | null | undefined;

/** El administrador de la app es siempre gerente; el resto, el rol guardado (por defecto conductor). */
export function rolDe(user: U, perfil: { rol: string }[] | undefined): Rol {
  if (isAdmin(user)) return 'gerente';
  const r = perfil?.[0]?.rol;
  return r === 'gerente' || r === 'administrativo' ? r : 'conductor';
}
export const esOficina = (r: Rol) => r !== 'conductor';

export const etiquetaRol: Record<Rol, string> = {
  conductor: 'Conductor',
  administrativo: 'Administrativo',
  gerente: 'Gerente',
};
