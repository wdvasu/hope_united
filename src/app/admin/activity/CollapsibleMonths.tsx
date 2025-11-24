"use client";
import { useState } from 'react';
import { ACTIVITY_CATEGORIES } from '@/lib/activityCategories';

export function CollapsibleMonths({ year, counts }: { year: number; counts: Record<string, number[]> }) {
  const [open, setOpen] = useState<boolean[]>(Array(12).fill(false));
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return (
    <div className="space-y-2">
      {months.map((name, i) => (
        <div key={i} className="border rounded">
          <button type="button" className="w-full text-left px-3 py-2 bg-zinc-50" onClick={() => setOpen((s)=>{const c=[...s];c[i]=!c[i];return c;})}>
            <span className="mr-2">{open[i] ? '▾' : '▸'}</span>
            {name} {year}
          </button>
          {open[i] && (
            <div className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ACTIVITY_CATEGORIES.map((c) => (
                  <div key={c} className="flex items-center justify-between border rounded px-3 py-2">
                    <span>{c}</span>
                    <span className="tabular-nums">{counts[c][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
