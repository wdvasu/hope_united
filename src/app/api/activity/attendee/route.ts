import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const id = cookieStore.get('attendee')?.value;
  if (!id) return NextResponse.json({ ok: false }, { status: 401 });
  const reg = await prisma.registration.findUnique({ where: { id }, select: { id: true, fullName: true } });
  if (!reg) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, id: reg.id, fullName: reg.fullName });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set('attendee', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return NextResponse.json({ ok: true });
}
