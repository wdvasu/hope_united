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

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? String(now.getUTCFullYear()));

  // Load all activities for the year once, aggregate in memory
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const acts = await prisma.activity.findMany({
    where: { createdAt: { gte: yearStart, lte: yearEnd } },
    select: { category: true, createdAt: true },
  });

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const counts: Record<string, number[]> = {};
  ACTIVITY_CATEGORIES.forEach((c) => (counts[c] = Array(12).fill(0)));
  for (const a of acts) {
    const d = new Date(a.createdAt);
    const mi = d.getUTCMonth();
    if (ACTIVITY_CATEGORIES.includes(a.category as ActivityCategory)) {
      counts[a.category as ActivityCategory]![mi] += 1;
    }
  }

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

      <CollapsibleMonths year={year} counts={counts} />
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
