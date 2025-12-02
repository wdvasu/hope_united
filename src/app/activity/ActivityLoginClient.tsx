"use client";
import { useState } from "react";

export default function ActivityLoginClient() {
  const [message, setMessage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [conflictOptions, setConflictOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

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
      } else {
        // Server will render sheet on next load
        window.location.href = "/activity";
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
        window.location.href = "/activity";
      }
    } catch {
      setMessage("Could not set attendee.");
    }
  };

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
