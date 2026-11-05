import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { users, verifications } from '@/db/schema';
import { adminEmails, noteFirstUser } from '@/lib/admin';
import { site } from '@/lib/site';

/**
 * firstadmin (Francesc 2026-10-16): with no admin address (no `TOTALUM_OWNER_EMAIL`, no `site.admins`) the first person
 * who signed up in this database (the preview's and the live site's are separate) is the admin once verified (`isAdmin`,
 * src/lib/admin.ts). Race-safe: the admin is ONE `verifications` row with a fixed id, written by a single
 * `INSERT … ON CONFLICT` when a sign-in method is created or a user deleted (better-auth hooks, src/lib/auth.ts): two
 * sign-ups at once → one row, one admin; it is never re-chosen while that user exists. "First" = the oldest user with
 * a sign-in method (`accounts` row) that is no sample person (`seed.md`) and no agent test user
 * (`delivered+agent-test-<n>@resend.dev`). Pages read the row inside `loadPage`'s batch (no extra round trip).
 * Far-future expiry: better-auth deletes expired verifications. Platform-owned; never edit.
 */
const CLAIM = 'totalum-first-admin';
const SAMPLE = /@example\.com$|agent-test/i;
const SAMPLE_ID = /^(seed|demo|starter)-/;

/** The claimed admin's id, if that user still exists. */
export function firstUserQuery() {
  return db
    .select({ id: users.id })
    .from(verifications)
    .innerJoin(users, eq(users.id, verifications.value))
    .where(eq(verifications.id, CLAIM));
}

function claimStatement() {
  const now = new Date().toISOString();
  return db.run(sql`insert into verifications (id, identifier, value, expires_at, created_at, updated_at)
    select ${CLAIM}, ${CLAIM}, u.id, '9999-12-31T00:00:00.000Z', ${now}, ${now} from users u
    where exists (select 1 from accounts a where a.user_id = u.id)
      and u.email not like '%@example.com' and u.email not like '%agent-test%'
      and u.id not like 'seed-%' and u.id not like 'demo-%' and u.id not like 'starter-%'
    order by u.created_at, u.id limit 1
    on conflict (id) do update set value = excluded.value, updated_at = excluded.updated_at
    where not exists (select 1 from users where users.id = verifications.value)`);
}

/** Whether this app must know its first user (sign-in on, no admin address). */
export function needsFirstUser(): boolean {
  return site.accounts && adminEmails().length === 0;
}

/** better-auth hooks (a sign-in method created, a user deleted): claims the first user when nobody holds the claim. */
export async function claimFirstUser(): Promise<void> {
  if (needsFirstUser()) await claimStatement();
}

type Me = { id: string; email: string } | null | undefined;

/**
 * Records the claim read by `firstUserQuery`. No claim yet (an owner e-mail removed after people signed up) and a real
 * user signed in → claims now (once: the claim then exists).
 */
export async function rememberFirstUser(rows: readonly { id: string }[], me: Me): Promise<void> {
  let id = rows[0]?.id ?? null;
  if (!id && me && !SAMPLE.test(me.email) && !SAMPLE_ID.test(me.id))
    id = (await db.batch([claimStatement(), firstUserQuery()]))[1][0]?.id ?? null;
  noteFirstUser(id);
}

/** `currentSession` / `ownerCode`: the claim read beside the session lookup, before `isAdmin` answers. */
export async function resolveFirstUser<S extends { user: { id: string; email: string } } | null>(
  session: Promise<S>,
): Promise<S> {
  if (!needsFirstUser()) return session;
  const [rows, s] = await Promise.all([firstUserQuery(), session]);
  await rememberFirstUser(rows, s?.user);
  return s;
}
