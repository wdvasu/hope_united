import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { deviceId, deviceSecret } = await req.json();
  if (!deviceId || !deviceSecret) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device || !device.active) return NextResponse.json({ error: 'Invalid device' }, { status: 401 });

  const ok = await bcrypt.compare(deviceSecret, device.secretHash);
  if (!ok) return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  const session = await prisma.session.create({ data: { deviceId, expiresAt } });

  const res = NextResponse.json({ ok: true, sessionId: session.id, expiresAt });
  res.cookies.set('sid', session.id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return res;
}
