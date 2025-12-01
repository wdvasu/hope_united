"use client";
import { useState } from 'react';
import { ACTIVITY_CATEGORIES, ActivityCategory } from '@/lib/activityCategories';

type ActivityEvent = { category: ActivityCategory; createdAt: string };
type Adjustment = { category: ActivityCategory; day: string; value: number };

export function CollapsibleMonths({ year, counts, events, adjustments, onAdjustmentSaved }: { year: number; counts: Record<string, number[]>; events: ActivityEvent[]; adjustments: Adjustment[]; onAdjustmentSaved?: (a: Adjustment)=>void }) {
  const [open, setOpen] = useState<boolean[]>(Array(12).fill(false));
  const [localAdjustments, setLocalAdjustments] = useState<Adjustment[]>(adjustments);
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
            <MonthDetailTable year={year} monthIndex={i} events={events} adjustments={localAdjustments} onSetAdjustment={(adj)=>{
              setLocalAdjustments((prev)=>{
                const idx = prev.findIndex(a=>a.category===adj.category && a.day===adj.day);
                if (adj.value === null as unknown as number) return prev; // type guard noop
                if (idx>=0) { const cp=[...prev]; cp[idx]=adj as Adjustment; return cp; }
                return [...prev, adj as Adjustment];
              });
              onAdjustmentSaved?.(adj as Adjustment);
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function MonthDetailTable({ year, monthIndex, events, adjustments, onSetAdjustment }: { year: number; monthIndex: number; events: ActivityEvent[]; adjustments: Adjustment[]; onSetAdjustment: (a: { category: ActivityCategory; day: string; value: number })=>void }) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate(); // local time
  const byCategory: Record<ActivityCategory, number[]> = Object.fromEntries(
    ACTIVITY_CATEGORIES.map((c) => [c, Array(daysInMonth).fill(0)])
  ) as Record<ActivityCategory, number[]>;
  for (const ev of events) {
    const d = new Date(ev.createdAt);
    if (d.getFullYear() === year && d.getMonth() === monthIndex) {
      const di = d.getDate() - 1; // 0-based index
      if (byCategory[ev.category]) byCategory[ev.category][di] += 1;
    }
  }
  // apply absolute overrides
  for (const adj of adjustments) {
    const d = new Date(adj.day);
    if (d.getFullYear() === year && d.getMonth() === monthIndex) {
      const di = d.getDate() - 1;
      if (byCategory[adj.category]) byCategory[adj.category][di] = adj.value;
    }
  }
  const totalsPerDay: number[] = Array(daysInMonth).fill(0);
  for (let di = 0; di < daysInMonth; di++) {
    totalsPerDay[di] = ACTIVITY_CATEGORIES.reduce((acc, c) => acc + byCategory[c][di], 0);
  }
  return (
    <div className="p-3 overflow-x-auto">
      <table className="min-w-[800px] text-xs">
        <thead>
          <tr>
            <th className="text-left p-2">Category</th>
            {Array.from({ length: daysInMonth }, (_, d) => (
              <th key={d} className="text-right p-2">{d + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ACTIVITY_CATEGORIES.map((c) => (
            <tr key={c} className="border-t">
              <td className="p-2 whitespace-nowrap">{c}</td>
              {byCategory[c].map((n, di) => {
                const dayStr = new Date(Date.UTC(year, monthIndex, di+1)).toISOString().slice(0,10);
                return (
                  <td key={di} className="p-2 text-right tabular-nums">
                    <EditableCell
                      value={n}
                      onSave={async (val) => {
                        const v = Number.isFinite(val) ? Math.max(0, Math.floor(val)) : 0;
                        await fetch('/api/activity/adjustments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ day: dayStr, category: c, value: v }) });
                        onSetAdjustment({ category: c, day: dayStr, value: v });
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t bg-zinc-50 font-medium">
            <td className="p-2">Daily Total</td>
            {totalsPerDay.map((n, di) => (
              <td key={di} className="p-2 text-right tabular-nums">{n || ''}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EditableCell({ value, onSave }: { value: number; onSave: (v: number)=>void | Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value || ''));
  const [saving, setSaving] = useState(false);
  const commit = async () => {
    const v = text.trim()==='' ? 0 : Number(text);
    setSaving(true);
    try { await onSave(Number.isFinite(v) ? v : 0); } finally { setSaving(false); setEditing(false); }
  };
  return (
    <div className="inline-block min-w-[48px] text-right">
      {!editing ? (
        <button
          type="button"
          className="px-1 py-0.5 rounded hover:bg-foreground/5 w-full text-right"
          title="Click to edit"
          onClick={()=>{ setText(String(value || '')); setEditing(true); }}
        >
          {value === 0 ? <span className="text-foreground/30">Add</span> : value}
        </button>
      ) : (
        <input
          className="w-16 text-right border rounded px-1 py-0.5"
          inputMode="numeric"
          placeholder="0"
          autoFocus
          value={text}
          onChange={(e)=>setText(e.target.value.replace(/[^0-9]/g,''))}
          onBlur={commit}
          onKeyDown={(e)=>{ if (e.key==='Enter') commit(); if (e.key==='Escape') setEditing(false); }}
          disabled={saving}
        />
      )}
    </div>
  );
}
