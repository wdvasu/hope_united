export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import Link from 'next/link';
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

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? String(now.getUTCFullYear()));

  // Load all activities and adjustments for the year once, aggregate in memory
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const acts = await prisma.activity.findMany({
    where: { createdAt: { gte: yearStart, lte: yearEnd } },
    select: { category: true, createdAt: true },
  });
  const adjustments = await prisma.activityAdjustment.findMany({
    where: { day: { gte: yearStart, lte: yearEnd } },
    select: { day: true, category: true, value: true },
  });
  const events: ActivityEvent[] = acts.map((a) => ({
    category: a.category as ActivityCategory,
    createdAt: a.createdAt.toISOString(),
  }));

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Build day-level map then overlay adjustments (absolute), then roll up to months
  const dayMap: Record<string, Record<string, number>> = {}; // category -> YYYY-MM-DD -> count
  for (const a of acts) {
    const d = new Date(a.createdAt);
    const dayKey = d.toISOString().slice(0,10); // UTC day
    const cat = a.category as ActivityCategory;
    if (!ACTIVITY_CATEGORIES.includes(cat)) continue;
    dayMap[cat] ||= {};
    dayMap[cat][dayKey] = (dayMap[cat][dayKey] || 0) + 1;
  }
  for (const adj of adjustments) {
    const dayKey = adj.day.toISOString().slice(0,10);
    const cat = adj.category as ActivityCategory;
    if (!ACTIVITY_CATEGORIES.includes(cat)) continue;
    dayMap[cat] ||= {};
    dayMap[cat][dayKey] = adj.value;
  }

  const counts: Record<string, number[]> = {};
  ACTIVITY_CATEGORIES.forEach((c) => (counts[c] = Array(12).fill(0)));
  Object.entries(dayMap).forEach(([cat, days]) => {
    for (const [dayKey, val] of Object.entries(days)) {
      const mi = new Date(`${dayKey}T00:00:00.000Z`).getUTCMonth();
      counts[cat][mi] += val;
    }
  });

  const totalsByMonth = Array(12).fill(0).map((_, i) => ACTIVITY_CATEGORIES.reduce((acc, c) => acc + counts[c][i], 0));
  const totalsByCategory = ACTIVITY_CATEGORIES.map((c) => counts[c].reduce((a, b) => a + b, 0));
  const yearTotal = totalsByMonth.reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-screen-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Daily Activity Report</h1>
        <div className="ml-auto flex items-center gap-2">
          <YearPicker year={year} />
          <Link className="px-3 py-2 rounded bg-black text-white" href={`/api/activity/export.xlsx?year=${year}`}>Download XLSX</Link>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-[1000px] text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left p-2">Category</th>
              {months.map((m) => (
                <th key={m} className="text-right p-2">{m}</th>
              ))}
              <th className="text-right p-2">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY_CATEGORIES.map((c, idx) => (
              <tr key={c} className="border-t">
                <td className="p-2">{c}</td>
                {counts[c].map((n, i) => (
                  <td key={i} className="p-2 text-right tabular-nums">{n}</td>
                ))}
                <td className="p-2 text-right font-medium tabular-nums">{totalsByCategory[idx]}</td>
              </tr>
            ))}
            <tr className="border-t bg-zinc-50 font-medium">
              <td className="p-2">Monthly Total</td>
              {totalsByMonth.map((n, i) => (
                <td key={i} className="p-2 text-right tabular-nums">{n}</td>
              ))}
              <td className="p-2 text-right tabular-nums">{yearTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <CollapsibleMonths year={year} counts={counts} events={events} adjustments={adjustments.map(a=>({ day: a.day.toISOString(), category: a.category as ActivityCategory, value: a.value }))} />
    </div>
  );
}

function YearPicker({ year }: { year: number }) {
  const years = [year - 1, year, year + 1];
  return (
    <div className="flex items-center gap-2">
      {years.map((y) => (
        <Link key={y} className={`px-3 py-2 rounded border ${y === year ? 'bg-foreground text-background' : ''}`} href={`/admin/activity?year=${y}`}>{y}</Link>
      ))}
    </div>
  );
}

import { CollapsibleMonths } from './CollapsibleMonths';
