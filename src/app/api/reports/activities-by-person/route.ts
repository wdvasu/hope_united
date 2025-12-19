
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // UTC date
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  const day = parsed.data.day || new Date().toISOString().slice(0, 10);
  const start = new Date(day + 'T00:00:00.000Z');
  const end = new Date(day + 'T23:59:59.999Z');

  // Group counts per person and category
  const grouped = await prisma.activity.groupBy({
    by: ['registrationId', 'category'],
    where: { registrationId: { not: null }, createdAt: { gte: start, lte: end } },
    _count: { _all: true },
  });

  const regIds = Array.from(new Set(grouped.map(g => g.registrationId!).filter(Boolean)));
  const regs = await prisma.registration.findMany({
    where: { id: { in: regIds } },
    select: { id: true, fullName: true, zipCode: true },
  });
  const regMap = new Map(regs.map(r => [r.id, r] as const));

  // Fetch details per person (category + timestamp)
  const details = await prisma.activity.findMany({
    where: { registrationId: { in: regIds }, createdAt: { gte: start, lte: end } },
    select: { registrationId: true, category: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  type Item = {
    registration: { id: string; fullName: string; zipCode: string | null };
    total: number;
    categories: Record<string, number>;
    details: Array<{ category: string; createdAt: string }>;
  };

  const itemsMap = new Map<string, Item>();

  // Initialize per registration
  for (const id of regIds) {
    const r = regMap.get(id);
    if (!r) continue;
    itemsMap.set(id, { registration: r, total: 0, categories: {}, details: [] });
  }

  // Fill counts
  for (const g of grouped) {
    const id = g.registrationId!;
    const item = itemsMap.get(id);
    if (!item) continue;
    item.total += g._count._all;
    item.categories[g.category] = (item.categories[g.category] || 0) + g._count._all;
  }

  // Fill details
  for (const d of details) {
    const item = itemsMap.get(d.registrationId!);
    if (!item) continue;
    item.details.push({ category: d.category, createdAt: d.createdAt.toISOString() });
  }

  const items = Array.from(itemsMap.values()).sort((a, b) => a.registration.fullName.localeCompare(b.registration.fullName));

  return NextResponse.json({ day, items });
}
