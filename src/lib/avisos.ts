import { and, eq, inArray } from 'drizzle-orm';
import { totalum } from 'totalum-sdk';

import { db } from '@/db';
import { perfiles, users } from '@/db/schema';
import { adminEmails, knownFirstUser } from '@/lib/admin';
import { site } from '@/lib/site';

/** Direcciones de la oficina: gerentes y administrativos con e-mail verificado, más el dueño. */
export async function destinatariosOficina(): Promise<string[]> {
  const rows = await db
    .select({ email: users.email })
    .from(perfiles)
    .innerJoin(users, eq(users.id, perfiles.userId))
    .where(and(inArray(perfiles.rol, ['gerente', 'administrativo']), eq(users.emailVerified, true)))
    .limit(50);
  const primero = knownFirstUser();
  const extra = primero ? await db.select({ email: users.email }).from(users).where(eq(users.id, primero)).limit(1) : [];
  const set = new Set<string>([...[...rows, ...extra].map((r) => r.email.toLowerCase()), ...adminEmails()]);
  if (process.env.TOTALUM_OWNER_EMAIL) set.add(process.env.TOTALUM_OWNER_EMAIL.toLowerCase());
  return [...set].filter((e) => !/@example\.com$/.test(e)).slice(0, 50);
}

export async function avisarOficina(subject: string, html: string, idempotencyKey: string) {
  const to = await destinatariosOficina();
  if (!to.length) return 0;
  await totalum.email.send({ to, subject, html, from: { name: site.name }, idempotencyKey });
  console.log('aviso enviado', subject, to.length);
  return to.length;
}
