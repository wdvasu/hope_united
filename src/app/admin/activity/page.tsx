export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { ACTIVITY_CATEGORIES, ActivityCategory } from '@/lib/activityCategories';

type SearchParams = {
  year?: string;
};

// helper kept if needed later
// function monthStartEnd(year: number, monthIndex0: number) {
//   const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0));
//   const end = new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59, 999));
//   return { start, end };
// }

type ActivityEvent = { category: ActivityCategory; createdAt: string };
type RawActivity = { category: string; createdAt: Date };
type RawAdjustment = { day: Date; category: string; value: number };

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? String(now.getUTCFullYear()));

  // Load all activities and adjustments for the year once, aggregate in memory
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const acts: RawActivity[] = await prisma.activity.findMany({
    where: { createdAt: { gte: yearStart, lte: yearEnd } },
    select: { category: true, createdAt: true },
  });
  const adjustments: RawAdjustment[] = await prisma.activityAdjustment.findMany({
    where: { day: { gte: yearStart, lte: yearEnd } },
    select: { day: true, category: true, value: true },
  });
  // Filter out any legacy/unknown categories to prevent client exceptions
  const events: ActivityEvent[] = acts
    .filter((a: RawActivity) => ACTIVITY_CATEGORIES.includes(a.category as ActivityCategory))
    .map((a: RawActivity) => ({
      category: a.category as ActivityCategory,
      createdAt: a.createdAt.toISOString(),
    }));

  return (
    <AdminActivityClient
      year={year}
      events={events}
      adjustments={adjustments
        .filter((a: RawAdjustment) => ACTIVITY_CATEGORIES.includes(a.category as ActivityCategory))
        .map((a: RawAdjustment)=>({ day: a.day.toISOString(), category: a.category as ActivityCategory, value: a.value }))}
    />
  );
}

import AdminActivityClient from './AdminActivityClient';
