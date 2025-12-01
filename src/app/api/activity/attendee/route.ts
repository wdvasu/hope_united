import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const id = cookieStore.get('attendee')?.value;
  if (!id) return NextResponse.json({ ok: false }, { status: 401 });
  const exists = await prisma.registration.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set('attendee', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}
