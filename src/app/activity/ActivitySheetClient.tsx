"use client";
import { useEffect, useMemo, useState } from "react";

import { ACTIVITY_CATEGORIES } from "@/lib/activityCategories";

const STORAGE_KEY = ["hopeunited", "activity", "selected", "v1"].join(":");

export default function ActivitySheetClient({ attendeeName }: { attendeeName: string }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const todayLabel = useMemo(() => {
    const now = new Date();
    try {
      return now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch {
      return now.toDateString();
    }
  }, []);

  const [version, setVersion] = useState<{commit?: string, branch?: string} | null>(null);
  const [cookie, setCookie] = useState<string | null>(null);
  // Lightweight debug footer to verify we are on the right build and cookie state
  useEffect(() => {
    (async () => {
      try { const v = await fetch('/api/version'); if (v.ok) setVersion(await v.json()); } catch {}
      try { const c = await fetch('/api/debug/cookies', { cache: 'no-store' }); if (c.ok) { const j = await c.json(); setCookie(j.attendee || null); } } catch {}
    })();
  }, []);

  // Load any saved selections (e.g., after forced re-login)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCategories(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist selections so the user doesn't lose choices on redirects
  useEffect(() => {
    try {
      if (categories.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [categories]);

  const submit = async () => {
    setMessage(null);
    const payload = { categories, at: new Date().toISOString() };
    try {
      const res = await fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 401) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(categories)); } catch {}
        // Attendee session expired, send back to activity login.
        window.location.href = '/activity';
        return;
      }
      if (!res.ok) throw new Error('Failed');
      const j = await res.json();
      setMessage(`Activities recorded (${j.count}).`);
      setSubmittedAt(new Date());
      setCategories([]);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      // After a successful submit, return to the Start menu (attendee cookie cleared server-side)
      window.location.href = '/start';
    } catch {
      setMessage('Could not save activity.');
    }
  };

  const Chip = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 rounded-full border text-base transition-colors ${selected ? 'bg-foreground text-background border-foreground' : 'bg-transparent border-foreground/30 text-foreground hover:bg-foreground/5'}`}>
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-[18px]">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold">Daily Activity</h1>
        {attendeeName && (
          <div className="ml-4 text-sm text-foreground/70">Client: <span className="font-medium text-foreground">{attendeeName}</span></div>
        )}
      </div>

      <section className="space-y-3">
        <div className="rounded border border-foreground/20 p-3 text-sm">
          <div className="font-medium">Date</div>
          <div>{todayLabel}</div>
        </div>
        <h2 className="font-medium">Choose one or more categories</h2>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_CATEGORIES.map((c) => {
            const sel = categories.includes(c);
            const toggle = () => setCategories(prev => sel ? prev.filter(x => x !== c) : [...prev, c]);
            return <Chip key={c} selected={sel} label={c} onClick={toggle} />
          })}
        </div>
      </section>

      {submittedAt && (
        <div className="rounded border border-foreground/20 p-3 text-sm">
          <div className="font-medium">Submitted</div>
          <div>{submittedAt.toLocaleString()}</div>
        </div>
      )}

      <button className="w-full h-14 rounded bg-indigo-600 text-white font-medium disabled:opacity-50" disabled={categories.length === 0} onClick={submit}>
        Save Selected Activities
      </button>

      {message && <p className="text-sm">{message}</p>}
      <div className="mt-6 text-xs text-foreground/60">Build {version?.branch}@{version?.commit} • attendee cookie: {cookie ?? 'none'}</div>
    </div>
  );
}
