"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ACTIVITY_CATEGORIES } from "@/lib/activityCategories";
import { useEffect } from "react";

export default function ActivityPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attendeeOk, setAttendeeOk] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [conflictOptions, setConflictOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const todayLabel = useMemo(() => {
    const now = new Date();
    try {
      return now.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return now.toDateString();
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/activity/attendee", { cache: "no-store" });
        setAttendeeOk(res.ok);
      } catch {
        setAttendeeOk(false);
      }
    })();
  }, []);

  const submit = async () => {
    setMessage(null);
    const payload = {
      category,
      at: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const j = await res.json();
      setMessage("Activity recorded.");
      setSubmittedAt(j.createdAt ? new Date(j.createdAt) : new Date());
      setCategory("");
      try { await fetch('/api/activity/attendee', { method: 'DELETE' }); } catch {}
      router.replace("/start");
    } catch {
      setMessage("Could not save activity.");
    }
  };

  const attendeeLogin = async () => {
    setMessage(null);
    try {
      const res = await fetch("/api/activity/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastInitial, birthYear: Number(birthYear) }),
      });
      if (res.status === 409) {
        const j = await res.json();
        setConflictOptions(j.options || []);
        setSelectedId((j.options?.[0]?.id) || "");
        setChoiceOpen(true);
        setMessage(null);
      } else if (!res.ok) {
        setMessage("Not found. Check name/initial/year.");
        setAttendeeOk(false);
      } else {
        setAttendeeOk(true);
        setMessage(null);
      }
    } catch {
      setMessage("Login failed");
    }
  };

  const resolveChoice = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch("/api/activity/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedId }),
      });
      if (!res.ok) {
        setMessage("Could not set attendee.");
      } else {
        setChoiceOpen(false);
        setAttendeeOk(true);
        setMessage(null);
      }
    } catch {
      setMessage("Could not set attendee.");
    }
  };

  const Chip = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-base transition-colors ${
        selected
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent border-foreground/30 text-foreground hover:bg-foreground/5"
      }`}
    >
      {label}
    </button>
  );

  if (attendeeOk === false || attendeeOk === null) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6 text-[18px]">
        <h1 className="text-2xl font-semibold">Activity Login</h1>
        <div className="space-y-3">
          <input className="w-full border rounded px-4 py-3 border-foreground/20" placeholder="First Name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          <input className="w-full border rounded px-4 py-3 border-foreground/20" placeholder="Last Initial" value={lastInitial} onChange={(e)=>setLastInitial(e.target.value.slice(0,1))} />
          <input className="w-full border rounded px-4 py-3 border-foreground/20" placeholder="Birth Year (YYYY)" inputMode="numeric" value={birthYear} onChange={(e)=>setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0,4))} />
          <button className="w-full h-14 rounded bg-indigo-600 text-white font-medium disabled:opacity-50" disabled={!firstName || !lastInitial || birthYear.length!==4} onClick={attendeeLogin}>Continue</button>
          {message && <p className="text-sm">{message}</p>}
        </div>
        {choiceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setChoiceOpen(false)} />
            <div className="relative z-10 w-[min(92vw,520px)] max-h-[80vh] overflow-auto rounded-lg bg-background text-foreground shadow-lg border border-foreground/20 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold">Select Registrant</h3>
                <button type="button" onClick={()=>setChoiceOpen(false)} className="px-3 py-1 rounded border">Close</button>
              </div>
              <label className="space-y-1 w-full">
                <div className="text-sm text-foreground/70">Matching residents</div>
                <select className="w-full border rounded px-3 py-2 bg-background" value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}>
                  {conflictOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-3 py-2 rounded border" onClick={()=>setChoiceOpen(false)}>Cancel</button>
                <button type="button" className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" disabled={!selectedId} onClick={resolveChoice}>Use This Resident</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const switchUser = async () => {
    try { await fetch('/api/activity/attendee', { method: 'DELETE' }); } catch {}
    setAttendeeOk(false);
    setMessage(null);
    setFirstName("");
    setLastInitial("");
    setBirthYear("");
    setConflictOptions([]);
    setChoiceOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-[18px]">
      <div className="flex items-center">
        <h1 className="text-2xl font-semibold">Daily Activity</h1>
        {attendeeOk === true && (
          <button type="button" onClick={switchUser} className="ml-auto text-sm underline text-indigo-600">Switch resident</button>
        )}
      </div>

      <section className="space-y-3">
        <div className="rounded border border-foreground/20 p-3 text-sm">
          <div className="font-medium">Date</div>
          <div>{todayLabel}</div>
        </div>
        <h2 className="font-medium">Choose a category</h2>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_CATEGORIES.map((c) => (
            <Chip key={c} selected={category === c} label={c} onClick={() => setCategory(c)} />
          ))}
        </div>
        {/* No "Other" in fixed category list */}
      </section>

      {submittedAt && (
        <div className="rounded border border-foreground/20 p-3 text-sm">
          <div className="font-medium">Submitted</div>
          <div>{submittedAt.toLocaleString()}</div>
        </div>
      )}

      <button
        className="w-full h-14 rounded bg-indigo-600 text-white font-medium disabled:opacity-50"
        disabled={!category}
        onClick={submit}
      >
        Save Activity
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
