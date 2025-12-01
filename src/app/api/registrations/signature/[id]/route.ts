import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const reg = await prisma.registration.findUnique({ where: { id }, select: { eSignatureImage: true } });
  if (!reg || !reg.eSignatureImage) return new NextResponse('Not Found', { status: 404 });
  const buf = Buffer.from(reg.eSignatureImage, 'base64');
  return new NextResponse(buf, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } });
}
