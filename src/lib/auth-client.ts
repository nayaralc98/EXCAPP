import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// "a.b.example" → "b.example": enough to tell another site's frame (a guess the wrong way only costs the new-tab notice)
const siteOf = (host: string) => host.split('.').slice(-2).join('.');

/**
 * loginfix: the app runs inside a frame of another site (another domain framing the published app), where the browser
 * keeps only a partitioned session cookie. A frame of the same site keeps the normal one.
 */
export function crossSiteFrame(): boolean {
  if (typeof window === 'undefined' || window.top === window.self) return false;
  const ancestors = window.location.ancestorOrigins as DOMStringList | undefined;
  const top = ancestors?.length ? ancestors.item(ancestors.length - 1) : document.referrer;
  try {
    return siteOf(new URL(top ?? '').hostname) !== siteOf(window.location.hostname);
  } catch {
    return true;
  }
}

/**
 * framesess: server actions and pages inside that frame carry no FRAME_HEADER, so a session they re-issue (changePassword
 * with revokeOtherSessions, a refreshed cookie cache) came back SameSite=Lax and the frame dropped it. This cookie lives
 * only in the frame's partition (never in the app's own tab) and tells src/lib/auth.ts the same thing on every request.
 */
if (crossSiteFrame()) document.cookie = '__Host-tlm_frame=1; Path=/; Secure; SameSite=None; Partitioned';

export const {
  signIn,
  signUp,
  signOut,
  getSession,
  useSession,
  emailOtp, // sendVerificationOtp / verifyEmail / requestPasswordReset / resetPassword: 8-digit codes by e-mail
  changePassword,
  updateUser,
  deleteUser,
} = createAuthClient({
  fetchOptions: {
    credentials: 'include',
    // src/lib/auth.ts FRAME_HEADER: the session cookie is then CHIPS-partitioned
    onRequest: (ctx) => {
      if (crossSiteFrame()) ctx.headers.set('x-totalum-frame', 'cross-site');
    },
  },
  plugins: [emailOTPClient()],
});

/**
 * After a sign-in inside a frame: did the browser keep the session? Some browsers (Safari, in-app browsers, strict
 * privacy settings) refuse every cookie in another site's frame; then only a tab of its own signs in.
 */
export async function sessionKept(): Promise<boolean> {
  if (typeof window === 'undefined' || window.top === window.self) return true;
  const { data } = await getSession();
  return !!data?.user;
}
