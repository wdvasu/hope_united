"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ACTIVITY_CATEGORIES, ActivityCategory } from '@/lib/activityCategories';
import { CollapsibleMonths } from './CollapsibleMonths';

type ActivityEvent = { category: ActivityCategory; createdAt: string };
type Adjustment = { category: ActivityCategory; day: string; value: number };

export default function AdminActivityClient({ year, events, adjustments: initialAdjustments }: { year: number; events: ActivityEvent[]; adjustments: Adjustment[] }) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>(initialAdjustments);

  const { counts, totalsByMonth, totalsByCategory, yearTotal } = useMemo(() => {
    const toLocalKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const dayMap: Record<string, Record<string, number>> = {};
    for (const ev of events) {
      const cat = ev.category;
      if (!ACTIVITY_CATEGORIES.includes(cat)) continue; // ignore unknown categories
      const d = new Date(ev.createdAt);
      const key = toLocalKey(d);
      dayMap[cat] ||= {};
      dayMap[cat][key] = (dayMap[cat][key] || 0) + 1;
    }
    for (const adj of adjustments) {
      const cat = adj.category;
      if (!ACTIVITY_CATEGORIES.includes(cat)) continue; // ignore unknown categories
      const d = new Date(adj.day);
      const key = toLocalKey(d);
      dayMap[cat] ||= {};
      dayMap[cat][key] = adj.value;
    }
    const counts: Record<string, number[]> = {};
    ACTIVITY_CATEGORIES.forEach((c) => (counts[c] = Array(12).fill(0)));
    Object.entries(dayMap).forEach(([cat, days]) => {
      if (!counts[cat]) return; // safety for any unexpected categories
      for (const [key, val] of Object.entries(days)) {
        const mi = Number(key.slice(5, 7)) - 1;
        counts[cat][mi] += val;
      }
    });
    const totalsByMonth = Array(12).fill(0).map((_, i) => ACTIVITY_CATEGORIES.reduce((acc, c) => acc + counts[c][i], 0));
    const totalsByCategory = ACTIVITY_CATEGORIES.map((c) => counts[c].reduce((a, b) => a + b, 0));
    const yearTotal = totalsByMonth.reduce((a, b) => a + b, 0);
    return { counts, totalsByMonth, totalsByCategory, yearTotal };
  }, [events, adjustments]);

  const onAdjustmentSaved = (a: Adjustment) => {
    setAdjustments((prev) => {
      const i = prev.findIndex(p => p.category === a.category && p.day === a.day);
      if (i >= 0) { const cp = [...prev]; cp[i] = a; return cp; }
      return [...prev, a];
    });
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

      <CollapsibleMonths
        year={year}
        counts={counts}
        events={events}
        adjustments={adjustments}
        onAdjustmentSaved={onAdjustmentSaved}
      />
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
