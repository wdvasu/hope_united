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
      if (!res.ok) {
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
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-[18px]">
      <h1 className="text-2xl font-semibold">Daily Activity</h1>

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
