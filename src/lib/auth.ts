import { cookies } from 'next/headers';
import { prisma } from './db';

export async function getSession() {
  const cookieStore = await cookies();
  const sid = cookieStore.get('sid')?.value;
  if (!sid) return null;
  const session = await prisma.session.findUnique({ where: { id: sid }, include: { device: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return session;
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}
