import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const firstName = String(body.firstName || '').trim();
  const lastInitial = String(body.lastInitial || '').trim().slice(0,1);
  const birthYear = Number(body.birthYear);
  if (!firstName || !lastInitial || !Number.isInteger(birthYear)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const r = await prisma.registration.findFirst({
    where: {
      firstName: { equals: firstName, mode: 'insensitive' },
      lastInitial: { equals: lastInitial, mode: 'insensitive' },
      birthYear: birthYear,
    },
    select: { id: true },
  });
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const cookieStore = await cookies();
  cookieStore.set('attendee', r.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
  return NextResponse.json({ ok: true });
}
