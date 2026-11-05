import { site } from '@/lib/site';

// sjfix SJ2: who may use the app's admin or staff pages. Anyone can sign up with any address, so an address alone
// proves nothing: an address counts only once its account has verified the e-mail (the 8-digit code `/account` →
// "Admin access" mails). Never grant a role by comparing `user.email` with an address
// (`npm run check`: ADMIN_BY_UNVERIFIED_EMAIL). A role kept in a table is set by an admin, not at sign-up.
// regate R4: the owner's sign-in e-mail (`TOTALUM_OWNER_EMAIL`, preset, never asked) is always one of them.
// ownernone (Francesc 2026-10-16): the owner e-mail may be unset or '' (no default any more): then only `site.admins`,
// and an empty entry is never an admin address.
export function adminEmails(): string[] {
  return [...site.admins, process.env.TOTALUM_OWNER_EMAIL ?? '']
    .map((a) => a.trim().toLowerCase())
    .filter((a) => a !== '');
}

// firstadmin (Francesc 2026-10-16): no admin address at all (no owner e-mail, no `site.admins`) → the FIRST person who
// signed up in this environment's own database (preview and live differ) is the admin, once their e-mail is
// verified (the same code as the owner's). `loadPage`, `currentSession` and `ownerCode` read that user's claim
// (`src/lib/first-user.ts`, race-safe) before they answer, so `isAdmin(user)` stays synchronous.
let firstUser: string | null = null;

/** firstadmin: the claimed first user's id (set by `src/lib/first-user.ts`); `null` = nobody yet. */
export function noteFirstUser(id: string | null | undefined): void {
  firstUser = id ?? null;
}
export function knownFirstUser(): string | null {
  return firstUser;
}

type AdminUser = { id?: string; email: string; emailVerified?: boolean | null } | null | undefined;

/** The admin pages are theirs once the e-mail is confirmed: an admin address, or the first user when there is none. */
export function adminCandidate(user: AdminUser, admins: readonly string[] = adminEmails()): boolean {
  if (!user) return false;
  if (!admins.length) return firstUser !== null && user.id === firstUser;
  const email = user.email.toLowerCase();
  return admins.some((a) => a.toLowerCase() === email);
}

export function isAdmin(user: AdminUser, admins: readonly string[] = adminEmails()): boolean {
  return !!user?.emailVerified && adminCandidate(user, admins);
}
