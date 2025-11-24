"use client";
import { useState } from "react";

const CATEGORIES = [
  "Supplies Pickup",
  "Harm Reduction Education",
  "Support Group",
  "Counseling",
  "Naloxone Distribution",
  "Other",
] as const;

export default function ActivityPage() {
  const [category, setCategory] = useState<string>("");
  const [other, setOther] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setMessage(null);
    const payload = {
      category: category === "Other" ? (other || "Other") : category,
      notes: notes || null,
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
      setMessage("Activity recorded.");
      setCategory("");
      setOther("");
      setNotes("");
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
        {category === "Other" && (
          <input
            className="w-full border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
            placeholder="If Other, please specify"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Notes (optional)</h2>
        <textarea
          className="w-full min-h-[100px] border rounded px-4 py-3 bg-background text-foreground placeholder:text-foreground/50 border-foreground/20"
          placeholder="Add any details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <button
        className="w-full h-14 rounded bg-indigo-600 text-white font-medium disabled:opacity-50"
        disabled={!category || (category === "Other" && !other.trim())}
        onClick={submit}
      >
        Save Activity
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
