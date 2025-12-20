"use client";

import { useEffect, useMemo, useState } from 'react';
import { ACTIVITY_CATEGORIES } from '@/lib/activityCategories';

type RegItem = { id: string; fullName: string; zipCode: string | null; birthYear: number | null };

type SearchResponse = { items: RegItem[] };

export default function ManualActivityPage() {
  const today = new Date().toISOString().slice(0,10);
  const [day, setDay] = useState<string>(today);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RegItem[]>([]);
  const [selected, setSelected] = useState<RegItem | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query || selected) { setResults([]); return; }
    const h = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/registrations/search?q=${encodeURIComponent(query)}&limit=20`);
        if (res.ok) {
          const j = (await res.json()) as SearchResponse;
          setResults(j.items);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(h);
  }, [query, selected]);

  const select = (r: RegItem) => {
    setSelected(r);
    setQuery(r.fullName);
    setOpen(false);
  };

  const clearPerson = () => {
    setSelected(null);
    setQuery('');
    setResults([]);
  };

  const toggle = (c: string) => setCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const atIso = useMemo(() => `${day}T12:00:00.000Z`, [day]);

  const submit = async () => {
    setMessage(null);
    if (!selected || cats.length === 0) return;
    try {
      const payload = { registrationId: selected.id, categories: cats, at: atIso };
      const res = await fetch('/api/activity/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed');
      const j = await res.json();
      setMessage(`Saved ${j.count} activities for ${selected.fullName}.`);
      setCats([]);
    } catch {
      setMessage('Could not save.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Manual Activity Entry</h1>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Day (UTC)</label>
        <input type="date" value={day} onChange={(e)=>setDay(e.target.value)} className="border rounded px-2 py-1" />
      </div>

      <div className="space-y-2 relative">
        <label className="block text-sm font-medium">Person</label>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Start typing a name..."
            value={query}
            onChange={(e)=>{ setQuery(e.target.value); setSelected(null); }}
            onFocus={()=>{ if(results.length>0) setOpen(true); }}
          />
          {selected && (<button className="text-sm underline" onClick={clearPerson}>Clear</button>)}
        </div>
        {open && results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full border rounded bg-white shadow max-h-64 overflow-auto">
            {results.map(r => (
              <button key={r.id} className="w-full text-left px-3 py-2 hover:bg-foreground/5" onClick={()=>select(r)}>
                <div className="font-medium">{r.fullName}</div>
                <div className="text-xs text-foreground/60">ZIP {r.zipCode ?? '—'} • {r.birthYear ?? '—'}</div>
              </button>
            ))}
          </div>
        )}
        {loading && <div className="text-xs text-foreground/60">Searching…</div>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Categories</label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_CATEGORIES.map((c) => {
            const sel = cats.includes(c)
            return (
              <button
                key={c}
                className={`px-4 py-2 rounded-full border text-base transition-colors ${sel ? 'bg-foreground text-background border-foreground' : 'bg-transparent border-foreground/30 text-foreground hover:bg-foreground/5'}`}
                onClick={()=>toggle(c)}
              >{c}</button>
            )
          })}
        </div>
      </div>

      <button className="w-full h-12 rounded bg-indigo-600 text-white font-medium disabled:opacity-50" disabled={!selected || cats.length===0} onClick={submit}>
        Save Activities
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
