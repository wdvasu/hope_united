import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  // If client already resolved to a specific registration ID
  if (body.selectedId) {
    const id = String(body.selectedId);
    const exists = await prisma.registration.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'Selection invalid' }, { status: 400 });
    const cookieStore = await cookies();
    cookieStore.set('attendee', id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
    return NextResponse.json({ ok: true });
  }
  const firstName = String(body.firstName || '').trim();
  const lastInitial = String(body.lastInitial || '').trim().slice(0,1);
  const birthYear = Number(body.birthYear);
  if (!firstName || !lastInitial || !Number.isInteger(birthYear)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const matches = await prisma.registration.findMany({
    where: {
      firstName: { equals: firstName, mode: 'insensitive' },
      lastInitial: { equals: lastInitial, mode: 'insensitive' },
      birthYear: birthYear,
    },
    select: { id: true, fullName: true, zipCode: true, createdAt: true },
  });
  if (matches.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (matches.length > 1) {
    const options = matches
      .sort((a,b) => a.fullName.localeCompare(b.fullName))
      .map(m => ({ id: m.id, label: `${m.fullName}${m.zipCode ? ` • ${m.zipCode}` : ''}` }));
    return NextResponse.json({ conflict: true, options }, { status: 409 });
  }
  const r = matches[0];
  const cookieStore = await cookies();
  cookieStore.set('attendee', r.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
  return NextResponse.json({ ok: true });
}
