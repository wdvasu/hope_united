import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function isSecureRequest(req: Request): boolean {
  try {
    const u = new URL(req.url);
    if (u.protocol === 'https:') return true;
  } catch {}
  const xf = req.headers.get('x-forwarded-proto') || '';
  const first = xf.split(',')[0].trim();
  return first === 'https';
}


export async function POST(req: Request) {
  // Find or create a demo device
  const label = 'Admin Demo Kiosk';
  let device = await prisma.device.findFirst({ where: { label } });
  if (!device) {
    device = await prisma.device.create({ data: { label, secretHash: 'DEMO', active: true } });
  }
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { deviceId: device.id, expiresAt } });
  const res = NextResponse.json({ ok: true, deviceId: device.id, sid: session.id });
  // Set session cookie so register page passes auth gate
  res.cookies.set('sid', session.id, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60, // 8 hours
  });
  return res;
}
