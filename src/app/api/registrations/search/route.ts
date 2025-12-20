import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const take = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') || 10)));
  if (!q) return NextResponse.json({ items: [] });
  const items = await prisma.registration.findMany({
    where: { fullName: { contains: q, mode: 'insensitive' } },
    select: { id: true, fullName: true, zipCode: true, birthYear: true },
    orderBy: { fullName: 'asc' },
    take,
  });
  return NextResponse.json({ items });
}
