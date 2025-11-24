"use client";
import { useState } from "react";

const CATEGORIES = [
  "Wellness",
  "Recovery Meeting",
  "Drop-In",
  "Veteran Programming",
  "Social Event",
  "Volunteer",
  "Peer Support",
  "Family Support",
  "Art",
  "Training/Focus Group",
  "Tour/Outreach",
] as const;

export default function ActivityPage() {
  const [category, setCategory] = useState<string>("");
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    } catch {
      setMessage("Could not save activity.");
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

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-[18px]">
      <h1 className="text-2xl font-semibold">Daily Activity</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Choose a category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
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
