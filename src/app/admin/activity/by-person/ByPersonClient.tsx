"use client";

import { useEffect, useMemo, useState } from 'react';
import { ACTIVITY_CATEGORIES } from '@/lib/activityCategories';

type ApiItem = {
  registration: { id: string; fullName: string; zipCode: string | null };
  total: number;
  categories: Record<string, number>;
  details: Array<{ category: string; createdAt: string }>; // present from API but unused in UI
};

type ApiResponse = { day: string; start?: string; end?: string; items: ApiItem[]; totalPeople: number };

export default function ByPersonClient() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDay, setStartDay] = useState<string>(today);
  const [endDay, setEndDay] = useState<string>(today);

  // Filter state
  const [zip, setZip] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [veteranStatus, setVeteranStatus] = useState<string>("");
  const [sexualOrientation, setSexualOrientation] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [race, setRace] = useState<string>("");
  const [ethnicity, setEthnicity] = useState<string>("");
  const [county, setCounty] = useState<string>("");

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (sDay: string, eDay: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start: sDay, end: eDay });
      if (zip) params.set('zip', zip);
      if (birthYear) params.set('birthYear', birthYear);
      if (veteranStatus) params.set('veteranStatus', veteranStatus);
      if (sexualOrientation) params.set('sexualOrientation', sexualOrientation);
      if (gender) params.set('gender', gender);
      if (race) params.set('race', race);
      if (ethnicity) params.set('ethnicity', ethnicity);
      if (county) params.set('county', county);
      const res = await fetch(`/api/reports/activities-by-person?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e) {
      setError('Could not load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(startDay, endDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.items ?? [];

  // Column totals (recomputed whenever rows change)
  const { grandTotal, categoryTotals } = useMemo(() => {
    const catTotals: Record<string, number> = Object.fromEntries(
      ACTIVITY_CATEGORIES.map((c) => [c, 0])
    );
    let total = 0;
    for (const r of rows) {
      total += r.total;
      for (const c of ACTIVITY_CATEGORIES) {
        catTotals[c] += r.categories[c] ?? 0;
      }
    }
    return { grandTotal: total, categoryTotals: catTotals };
  }, [rows]);

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
    return lines.join('\n');
  }, [rows]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_by_person_${startDay}_to_${endDay}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Activity by Person (Date Range)</h1>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm">Start (UTC)</label>
        <input type="date" value={startDay} onChange={(e) => setStartDay(e.target.value)} className="border rounded px-2 py-1" />
        <label className="text-sm">End (UTC)</label>
        <input type="date" value={endDay} onChange={(e) => setEndDay(e.target.value)} className="border rounded px-2 py-1" />
        <button onClick={() => load(startDay, endDay)} className="border rounded px-3 py-1 hover:bg-foreground/5">Load</button>
        <button onClick={downloadCsv} className="border rounded px-3 py-1 hover:bg-foreground/5">Export CSV</button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm">ZIP</label>
        <input value={zip} onChange={(e)=>setZip(e.target.value)} className="border rounded px-2 py-1 w-28" placeholder="e.g. 44308" />
        <label className="text-sm">Birth Year</label>
        <input value={birthYear} onChange={(e)=>setBirthYear(e.target.value.replace(/[^0-9]/g,'').slice(0,4))} className="border rounded px-2 py-1 w-24" placeholder="YYYY" />
        <label className="text-sm">Veteran</label>
        <Select value={veteranStatus} onChange={setVeteranStatus} options={["","YES","NO","REFUSED"]} />
        <label className="text-sm">Sexual Orientation</label>
        <Select value={sexualOrientation} onChange={setSexualOrientation} options={["","HETEROSEXUAL","GAY_LESBIAN","BISEXUAL","OTHER","REFUSED"]} />
        <label className="text-sm">Gender</label>
        <Select value={gender} onChange={setGender} options={["","FEMALE","MALE","TRANSGENDER","NON_BINARY","OTHER","REFUSED"]} />
        <label className="text-sm">Race</label>
        <Select value={race} onChange={setRace} options={["","WHITE","BLACK_AFRICAN_AMERICAN","ASIAN","AMERICAN_INDIAN_ALASKA_NATIVE","NATIVE_HAWAIIAN_PACIFIC_ISLANDER","OTHER","REFUSED"]} />
        <label className="text-sm">Ethnicity</label>
        <Select value={ethnicity} onChange={setEthnicity} options={["","HISPANIC_LATINO","NOT_HISPANIC_LATINO","REFUSED"]} />
        <label className="text-sm">County</label>
        <Select value={county} onChange={setCounty} options={["","SUMMIT","STARK","PORTAGE","CUYAHOGA","OTHER_OH_COUNTY","OUT_OF_STATE","REFUSED"]} />
        <button onClick={() => load(startDay, endDay)} className="border rounded px-3 py-1 hover:bg-foreground/5">Apply Filters</button>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                  <tr key={r.registration.id}>
                    <td className="p-2 border whitespace-nowrap">{r.registration.fullName}</td>
                    <td className="p-2 border whitespace-nowrap">{r.registration.zipCode}</td>
                    <td className="p-2 border text-right">{r.total}</td>
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <td key={c} className="p-2 border text-right">{r.categories[c] ?? 0}</td>
                    ))}
                  </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-2 border" colSpan={ACTIVITY_CATEGORIES.length + 3}>No data for this range.</td></tr>
              )}
              {rows.length > 0 && (
                <>
                  <tr className="bg-foreground/10 font-semibold">
                    <td className="p-2 border text-right" colSpan={2}>Totals</td>
                    <td className="p-2 border text-right">{grandTotal}</td>
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <td key={c} className="p-2 border text-right">{categoryTotals[c] ?? 0}</td>
                    ))}
                  </tr>
                  <tr className="bg-foreground/5 font-semibold">
                    <td className="p-2 border text-right" colSpan={2}>Total People</td>
                    <td className="p-2 border text-right" colSpan={ACTIVITY_CATEGORIES.length + 1}>{data?.totalPeople ?? 0}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function csvEscape(s: string) {
  if(/[\",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function Select({ value, onChange, options }: { value: string; onChange: (v:string)=>void; options: string[] }) {
  return (
    <select value={value} onChange={(e)=>onChange(e.target.value)} className="border rounded px-2 py-1">
      {options.map((o)=> (
        <option key={o} value={o}>{o==='' ? 'Any' : o}</option>
      ))}
    </select>
  );
}
