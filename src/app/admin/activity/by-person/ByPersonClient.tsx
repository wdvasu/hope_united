"use client";

import { useEffect, useMemo, useState } from 'react';
import { ACTIVITY_CATEGORIES } from '@/lib/activityCategories';

type ApiItem = {
  registration: { id: string; fullName: string; zipCode: string | null };
  total: number;
  categories: Record<string, number>;
  details: Array<{ category: string; createdAt: string }>;
};

type ApiResponse = { day: string; items: ApiItem[] };

export default function ByPersonClient() {
  const [day, setDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/activities-by-person?day=${encodeURIComponent(d)}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as ApiResponse;
      setData(json);
      setExpanded({});
    } catch (e) {
      setError('Could not load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.items ?? [];

  const csv = useMemo(() => {
    const headers = ['Full Name', 'ZIP', 'Total', ...ACTIVITY_CATEGORIES];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const counts = ACTIVITY_CATEGORIES.map((c) => String(r.categories[c] ?? 0));
      lines.push([
        csvEscape(r.registration.fullName),
        csvEscape(r.registration.zipCode || ''),
        String(r.total),
        ...counts,
      ].join(','));
    }
    return lines.join('\\n');
  }, [rows]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_by_person_${day}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Activity by Person (Daily)</h1>
      <div className="flex items-center gap-3">
        <label className="text-sm">Day (UTC)</label>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="border rounded px-2 py-1" />
        <button onClick={() => load(day)} className="border rounded px-3 py-1 hover:bg-foreground/5">Load</button>
        <button onClick={downloadCsv} className="border rounded px-3 py-1 hover:bg-foreground/5">Export CSV</button>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded">
            <thead>
              <tr className="bg-foreground/5">
                <th className="text-left p-2 border">Person</th>
                <th className="text-left p-2 border">ZIP</th>
                <th className="text-right p-2 border">Total</th>
                {ACTIVITY_CATEGORIES.map((c) => (
                  <th key={c} className="text-right p-2 border">{c}</th>
                ))}
                <th className="p-2 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <>
                  <tr key={r.registration.id}>
                    <td className="p-2 border whitespace-nowrap">{r.registration.fullName}</td>
                    <td className="p-2 border whitespace-nowrap">{r.registration.zipCode}</td>
                    <td className="p-2 border text-right">{r.total}</td>
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <td key={c} className="p-2 border text-right">{r.categories[c] ?? 0}</td>
                    ))}
                    <td className="p-2 border text-center">
                      <button
                        className="text-blue-700 underline"
                        onClick={() => setExpanded((e) => ({ ...e, [r.registration.id]: !e[r.registration.id] }))}
                      >
                        {expanded[r.registration.id] ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  {expanded[r.registration.id] && (
                    <tr>
                      <td className="p-2 border bg-foreground/5" colSpan={ACTIVITY_CATEGORIES.length + 4}>
                        <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {r.details.map((d, i) => (
                            <li key={i} className="border rounded p-2 bg-background">
                              <span className="font-mono mr-2">{formatTime(d.createdAt)}</span>
                              <span>{d.category}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-2 border" colSpan={ACTIVITY_CATEGORIES.length + 4}>No data for this day.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(11, 19); // HH:MM:SS
}

function csvEscape(s: string) {
  if (/[\",\\n]/.test(s)) return '\"' + s.replace(/\"/g, '\"\"') + '\"';
  return s;
}
