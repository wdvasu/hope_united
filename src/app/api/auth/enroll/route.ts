import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

function randomId(n = 16) {
  return [...crypto.getRandomValues(new Uint8Array(n))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(req: Request) {
  const { label } = await req.json().catch(() => ({ label: 'Tablet' }));
  const deviceId = crypto.randomUUID();
  const deviceSecret = randomId(16);
  const secretHash = await bcrypt.hash(deviceSecret, 10);

  const device = await prisma.device.create({
    data: { id: deviceId, label: label || 'Tablet', secretHash },
  });

  const payload = JSON.stringify({ deviceId, deviceSecret });
  const qrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 280 });

  return NextResponse.json({ device, deviceSecret, qrDataUrl });
}
