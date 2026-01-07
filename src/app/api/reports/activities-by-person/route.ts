
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // single day (UTC)
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // start day (UTC)
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),   // end day (UTC)
  // Optional registration filters (all exact match)
  zip: z.string().min(1).max(10).optional(),
  birthYear: z.string().regex(/^\d{4}$/).optional(),
  veteranStatus: z.string().optional(),
  sexualOrientation: z.string().optional(),
  gender: z.string().optional(),
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  county: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  const day = parsed.data.day || new Date().toISOString().slice(0, 10);
  let start = new Date(day + 'T00:00:00.000Z');
  let end = new Date(day + 'T23:59:59.999Z');
  if (parsed.data.start && parsed.data.end) {
    start = new Date(parsed.data.start + 'T00:00:00.000Z');
    end = new Date(parsed.data.end + 'T23:59:59.999Z');
    if (start > end) { const t = start; start = end; end = t; }
  }
  const filters = {
    zip: parsed.data.zip?.trim(),
    birthYear: parsed.data.birthYear ? parseInt(parsed.data.birthYear, 10) : undefined,
    veteranStatus: parsed.data.veteranStatus?.trim(),
    sexualOrientation: parsed.data.sexualOrientation?.trim(),
    gender: parsed.data.gender?.trim(),
    race: parsed.data.race?.trim(),
    ethnicity: parsed.data.ethnicity?.trim(),
    county: parsed.data.county?.trim(),
  } as const;

  // Group counts per person and category
  const grouped = await prisma.activity.groupBy({
    by: ['registrationId', 'category'],
    where: { registrationId: { not: null }, createdAt: { gte: start, lte: end } },
    _count: { _all: true },
  });

  const regIds = Array.from(new Set(grouped.map((g: { registrationId: string | null }) => g.registrationId!).filter(Boolean))) as string[];
  const regs = await prisma.registration.findMany({
    where: ({
      id: { in: regIds },
      ...(filters.zip ? { zipCode: filters.zip } : {}),
      ...(typeof filters.birthYear === 'number' && !Number.isNaN(filters.birthYear) ? { birthYear: filters.birthYear } : {}),
      ...(filters.veteranStatus ? { veteranStatus: filters.veteranStatus } : {}),
      ...(filters.sexualOrientation ? { sexualOrientation: filters.sexualOrientation } : {}),
      ...(filters.gender ? { gender: filters.gender } : {}),
      ...(filters.race ? { race: filters.race } : {}),
      ...(filters.ethnicity ? { ethnicity: filters.ethnicity } : {}),
      ...(filters.county ? { county: filters.county } : {}),
    } as any),
    select: { id: true, fullName: true, zipCode: true },
  });
  const regMap = new Map<string, { id: string; fullName: string; zipCode: string | null }>(regs.map((r: { id: string; fullName: string; zipCode: string | null }) => [r.id, r]));

  // Fetch details per person (category + timestamp)
  const details = await prisma.activity.findMany({
    where: { registrationId: { in: regs.map((r: { id: string }) => r.id) }, createdAt: { gte: start, lte: end } },
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
  for (const id of regs.map((r: { id: string }) => r.id)) {
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

  return NextResponse.json({ day, start: start.toISOString(), end: end.toISOString(), items, totalPeople: items.length });
}
