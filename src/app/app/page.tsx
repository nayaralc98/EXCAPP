import { redirect } from 'next/navigation';

import { currentSession } from '@/lib/auth';

import { MovilApp } from './movil-app';

export const metadata = { title: 'App del conductor' };

export default async function Page() {
  const session = await currentSession({ admin: false });
  if (!session) redirect('/login');
  return <MovilApp userId={session.user.id} nombre={session.user.name || session.user.email} />;
}
