
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // single day (UTC)
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // start day (UTC)
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),   // end day (UTC)
  // Optional registration filters (all exact match)
  personName: z.string().min(1).optional(),
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
    personName: parsed.data.personName?.trim(),
    zip: parsed.data.zip?.trim(),
    birthYear: parsed.data.birthYear ? parseInt(parsed.data.birthYear, 10) : undefined,
    veteranStatus: parsed.data.veteranStatus?.trim(),
    sexualOrientation: parsed.data.sexualOrientation?.trim(),
    gender: parsed.data.gender?.trim(),
    race: parsed.data.race?.trim(),
    ethnicity: parsed.data.ethnicity?.trim(),
    county: parsed.data.county?.trim(),
  } as const;

  // Build registration filter clause first
  const regWhereClause: Record<string, unknown> = {};
  if (filters.personName) regWhereClause.fullName = { contains: filters.personName, mode: 'insensitive' };
  if (filters.zip) regWhereClause.zipCode = filters.zip;
  if (typeof filters.birthYear === 'number' && !Number.isNaN(filters.birthYear)) regWhereClause.birthYear = filters.birthYear;
  if (filters.veteranStatus) regWhereClause.veteranStatus = filters.veteranStatus;
  if (filters.sexualOrientation) regWhereClause.sexualOrientation = filters.sexualOrientation;
  if (filters.gender) regWhereClause.gender = filters.gender;
  if (filters.race) regWhereClause.race = filters.race;
  if (filters.ethnicity) regWhereClause.ethnicity = filters.ethnicity;
  if (filters.county) regWhereClause.county = filters.county;

  // Get filtered registrations first
  const regs = await prisma.registration.findMany({
    where: regWhereClause,
    select: { id: true, fullName: true, zipCode: true },
  });

  const regIds = regs.map((r: { id: string }) => r.id);

  // Group counts per person and category, summing attendeeCount - only for filtered registrations
  const grouped = await prisma.activity.groupBy({
    by: ['registrationId', 'category'],
    where: { 
      registrationId: { in: regIds },
      createdAt: { gte: start, lte: end } 
    },
    _sum: { attendeeCount: true },
  });
  const regMap = new Map<string, { id: string; fullName: string; zipCode: string | null }>(regs.map((r: { id: string; fullName: string; zipCode: string | null }) => [r.id, r]));

  // Fetch details per person (category + timestamp + attendeeCount)
  const details = await prisma.activity.findMany({
    where: { registrationId: { in: regs.map((r: { id: string }) => r.id) }, createdAt: { gte: start, lte: end } },
    select: { registrationId: true, category: true, createdAt: true, attendeeCount: true },
    orderBy: { createdAt: 'asc' },
  });

  // Determine if any demographic filters are applied
  const hasFilters = !!(
    filters.personName || 
    filters.zip || 
    filters.birthYear || 
    filters.veteranStatus || 
    filters.sexualOrientation || 
    filters.gender || 
    filters.race || 
    filters.ethnicity || 
    filters.county
  );

  // Fetch anonymous group activities only if no demographic filters are applied
  const anonymousActivities = hasFilters ? [] : await prisma.activity.findMany({
    where: { registrationId: null, createdAt: { gte: start, lte: end } },
    select: { category: true, createdAt: true, attendeeCount: true },
    orderBy: { createdAt: 'asc' },
  });

  type Item = {
    registration: { id: string; fullName: string; zipCode: string | null };
    total: number;
    uniqueDays: number;
    categories: Record<string, number>;
    details: Array<{ category: string; createdAt: string; attendeeCount: number }>;
  };

  const itemsMap = new Map<string, Item>();

  // Initialize per registration
  for (const id of regs.map((r: { id: string }) => r.id)) {
    const r = regMap.get(id);
    if (!r) continue;
    itemsMap.set(id, { registration: r, total: 0, uniqueDays: 0, categories: {}, details: [] });
  }

  // Fill counts (sum attendeeCount)
  for (const g of grouped) {
    const id = g.registrationId!;
    const item = itemsMap.get(id);
    if (!item) continue;
    const count = g._sum.attendeeCount || 0;
    item.total += count;
    item.categories[g.category] = (item.categories[g.category] || 0) + count;
  }

  // Fill details
  for (const d of details) {
    const item = itemsMap.get(d.registrationId!);
    if (!item) continue;
    item.details.push({ category: d.category, createdAt: d.createdAt.toISOString(), attendeeCount: d.attendeeCount });
  }

  // Calculate unique days per person
  for (const item of itemsMap.values()) {
    const uniqueDaysSet = new Set<string>();
    for (const d of item.details) {
      const dayKey = d.createdAt.slice(0, 10);
      uniqueDaysSet.add(dayKey);
    }
    item.uniqueDays = uniqueDaysSet.size;
  }

  // Process anonymous activities - group all into a single "Anonymous" row
  const anonymousItem: Item | null = anonymousActivities.length > 0 ? {
    registration: { id: 'anonymous', fullName: 'Anonymous', zipCode: null },
    total: 0,
    uniqueDays: 0,
    categories: {},
    details: [],
  } : null;
  
  if (anonymousItem) {
    for (const activity of anonymousActivities) {
      const count = activity.attendeeCount;
      anonymousItem.total += count;
      anonymousItem.categories[activity.category] = (anonymousItem.categories[activity.category] || 0) + count;
      anonymousItem.details.push({ 
        category: activity.category, 
        createdAt: activity.createdAt.toISOString(), 
        attendeeCount: count 
      });
    }
    // Set uniqueDays to 0 for anonymous to avoid double counting 
    // (anonymous attendees may already be counted as named individuals)
    anonymousItem.uniqueDays = 0;
  }

  // Combine anonymous (first) and named people (sorted alphabetically)
  // Only include people who actually have activities (total > 0)
  const namedItems = Array.from(itemsMap.values())
    .filter(item => item.total > 0)
    .sort((a, b) => a.registration.fullName.localeCompare(b.registration.fullName));
  const items = [
    ...(anonymousItem ? [anonymousItem] : []),
    ...namedItems,
  ];

  const totalVisits = items.reduce((sum, item) => sum + item.total, 0);

  // Calculate total unique person-day visits
  const uniqueVisits = new Set<string>();
  for (const d of details) {
    const dayKey = d.createdAt.toISOString().slice(0, 10);
    const personDayKey = `${d.registrationId}-${dayKey}`;
    uniqueVisits.add(personDayKey);
  }
  // Add anonymous unique visits (count unique person-days)
  if (anonymousItem) {
    const anonymousDays = new Map<string, number>();
    for (const d of anonymousItem.details) {
      const dayKey = d.createdAt.slice(0, 10);
      anonymousDays.set(dayKey, (anonymousDays.get(dayKey) || 0) + d.attendeeCount);
    }
    // Add each anonymous person-day to unique visits
    for (const [_day, count] of anonymousDays) {
      // Each anonymous person on that day counts as a unique visit
      for (let i = 0; i < count; i++) {
        uniqueVisits.add(`anonymous-${_day}-${i}`);
      }
    }
  }
  const totalUniqueVisits = uniqueVisits.size;

  return NextResponse.json({ day, start: start.toISOString(), end: end.toISOString(), items, totalPeople: items.length, totalVisits, totalUniqueVisits });
}
