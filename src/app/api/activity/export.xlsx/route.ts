import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ACTIVITY_CATEGORIES, ActivityCategory } from '@/lib/activityCategories';
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const year = Number(url.searchParams.get('year') ?? new Date().getUTCFullYear());

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
  // Build LOCAL day map and overlay adjustments; then roll up to LOCAL months for parity with admin report
  const dayMap: Record<string, Record<string, number>> = {};
  const toLocalKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  for (const a of acts) {
    const d = new Date(a.createdAt);
    const dayKey = toLocalKey(d);
    const cat = a.category as ActivityCategory;
    if (!ACTIVITY_CATEGORIES.includes(cat)) continue;
    dayMap[cat] ||= {};
    dayMap[cat][dayKey] = (dayMap[cat][dayKey] || 0) + 1;
  }
  for (const adj of adjustments) {
    const d = new Date(adj.day);
    const dayKey = toLocalKey(d);
    const cat = adj.category as ActivityCategory;
    if (!ACTIVITY_CATEGORIES.includes(cat)) continue;
    dayMap[cat] ||= {};
    dayMap[cat][dayKey] = adj.value;
  }
  const counts: Record<string, number[]> = {};
  ACTIVITY_CATEGORIES.forEach((c) => (counts[c] = Array(12).fill(0)));
  Object.entries(dayMap).forEach(([cat, days]) => {
    for (const [dayKey, val] of Object.entries(days)) {
      const mi = Number(dayKey.slice(5,7)) - 1; // month index from local key
      counts[cat][mi] += val;
    }
  });
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const data: (string | number)[][] = [];
  data.push(['Category', ...months, 'Grand Total']);
  for (const c of ACTIVITY_CATEGORIES) {
    const row = counts[c];
    const total = row.reduce((a,b)=>a+b,0);
    data.push([c, ...row, total]);
  }
  const monthTotals = Array(12).fill(0).map((_, i) => ACTIVITY_CATEGORIES.reduce((acc, c) => acc + counts[c][i], 0));
  const yearTotal = monthTotals.reduce((a,b)=>a+b,0);
  data.push(['Monthly Total', ...monthTotals, yearTotal]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, String(year));
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="daily-activity-${year}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}
