'use server';

import { headers } from 'next/headers';

import { ownerCode } from '@/lib/owner-code';

/** ownermail: the sign-up form's call — the owner's own address gets its confirmation code at once (`ownerCode`). */
export async function sendOwnerCode(): Promise<boolean> {
  const h = await headers();
  const url =
    h.get('x-opennext-initial-url') ??
    `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost'}/`;
  return ownerCode(new Request(url, { headers: h }));
}
