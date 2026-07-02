"use client";

import { useEffect, useMemo, useState } from 'react';
import { ACTIVITY_CATEGORIES } from '@/lib/activityCategories';

export default function GroupEventEntryPage() {
  const today = new Date().toISOString().slice(0,10);
  const [day, setDay] = useState<string>(today);
  const [cats, setCats] = useState<string[]>([]);
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [message, setMessage] = useState<string | null>(null);

  // Ensure a device session exists so the API can attribute deviceId
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) {
          await fetch('/api/auth/demo-session', { method: 'POST' });
        }
      } catch {
        // best-effort; UI will still show an error on submit if something blocks
      }
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = (c: string) => setCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const atIso = useMemo(() => `${day}T12:00:00.000Z`, [day]);

  const submit = async () => {
    setMessage(null);
    if (cats.length === 0 || attendeeCount < 1) return;
    try {
      // Create activities without a registrationId (anonymous group event)
      const data = cats.map((c) => ({
        category: c,
        attendeeCount,
        createdAt: atIso,
        registrationId: null,
      }));

      const res = await fetch('/api/activity/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: data }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session error. Please refresh the page and try again.');
        }
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed (${res.status}) ${txt}`);
      }
      const j = await res.json();
      setMessage(`Saved ${j.count} group activities with ${attendeeCount} attendees each.`);
      setCats([]);
      setAttendeeCount(1);
    } catch (e) {
      const msg = (e as Error)?.message || '';
      setMessage(`Could not save. ${msg}`.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Group Event Entry</h1>
      <p className="text-sm text-foreground/70">
        Record activities for group events where you don&apos;t have individual participant names.
        The attendee count will be applied to all selected categories.
      </p>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Date</label>
        <input type="date" value={day} onChange={(e)=>setDay(e.target.value)} className="border rounded px-3 py-2" />
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

      <div className="space-y-2">
        <label className="block text-sm font-medium">Number of Attendees</label>
        <input
          type="number"
          min="1"
          value={attendeeCount}
          onChange={(e) => setAttendeeCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="border rounded px-3 py-2 w-40"
        />
        <p className="text-xs text-foreground/60">
          Total number of people who attended this group event (anonymous count)
        </p>
      </div>

      <div className="rounded border border-foreground/20 p-4 bg-foreground/5">
        <h3 className="font-medium mb-2">Preview</h3>
        <p className="text-sm">
          {cats.length === 0 ? (
            <span className="text-foreground/60">Select categories to see preview</span>
          ) : (
            <>
              Recording <strong>{attendeeCount} people</strong> for:{' '}
              <strong>{cats.join(', ')}</strong> on <strong>{day}</strong>
            </>
          )}
        </p>
      </div>

      <button
        className="w-full h-12 rounded bg-indigo-600 text-white font-medium disabled:opacity-50"
        disabled={cats.length===0 || attendeeCount < 1}
        onClick={submit}
      >
        Save Group Event
      </button>

      {message && (
        <div className={`text-sm p-3 rounded ${message.includes('Could not') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
