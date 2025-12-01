import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const setSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD (UTC)
  category: z.string().min(1).max(100),
  value: z.number().int().min(0).nullable(), // null deletes
});

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = setSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { day, category, value } = parsed.data;
  const dayDate = new Date(`${day}T00:00:00.000Z`);
  try {
    if (value === null) {
      await prisma.activityAdjustment.delete({ where: { day_category: { day: dayDate, category } } }).catch(() => null);
      return NextResponse.json({ ok: true, deleted: true });
    }
    const rec = await prisma.activityAdjustment.upsert({
      where: { day_category: { day: dayDate, category } },
      update: { value },
      create: { day: dayDate, category, value },
    });
    return NextResponse.json({ ok: true, id: rec.id, value: rec.value });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const year = Number(url.searchParams.get('year') ?? new Date().getUTCFullYear());
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const list = await prisma.activityAdjustment.findMany({
    where: { day: { gte: yearStart, lte: yearEnd } },
    select: { day: true, category: true, value: true },
    orderBy: { day: 'asc' },
  });
  return NextResponse.json({ items: list.map(l => ({ day: l.day.toISOString().slice(0,10), category: l.category, value: l.value })) });
}
