import { adminCandidate, adminEmails } from '@/lib/admin';
import { getAuth } from '@/lib/auth';
import { resolveFirstUser } from '@/lib/first-user';
import { site } from '@/lib/site';

/**
 * ownermail (Francesc 2026-10-16, Fibo: the person who built the app signed up and got "Staff only"): right after
 * sign-up, an admin address (the owner's, `site.admins`) that is not confirmed yet gets its 8-digit code at once, and
 * the sign-up form takes it to /verify-email — one step to the admin pages, as on the old engine. `true` = a code went
 * out. Anyone else: nothing is sent. Platform-owned.
 * firstadmin (Francesc 2026-10-16): with no admin address, the first person to sign up is the admin (`isAdmin`) and
 * gets the same code; nobody else does.
 */
export async function ownerCode(req: Request): Promise<boolean> {
  // ownernone: no admin address and no sign-in (nobody can be the first user): nothing to do, no read
  if (!adminEmails().length && !site.accounts) return false;
  const auth = getAuth(req);
  const session = auth.api.getSession({ headers: req.headers, query: { disableCookieCache: true } });
  const user = (await resolveFirstUser(session))?.user;
  if (!user || user.emailVerified || !adminCandidate(user)) return false;
  await auth.api.sendVerificationOTP({ body: { email: user.email, type: 'email-verification' } });
  return true;
}
