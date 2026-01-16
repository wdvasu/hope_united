"use client";

import Link from "next/link";

export default function AdminIndexPage() {
  const openDemo = async () => {
    try {
      const res = await fetch("/api/auth/demo-session", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create demo session");
      window.open("/start", "_blank", "noopener,noreferrer");
    } catch (e) {
      alert("Could not start demo kiosk. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/registrations" className="border rounded p-4 hover:bg-foreground/5">Registrations</Link>
        <Link href="/admin/activity" className="border rounded p-4 hover:bg-foreground/5">Activity Report</Link>
        <Link href="/admin/activity/by-person" className="border rounded p-4 hover:bg-foreground/5">Activity by Person (Date Range)</Link>
        <Link href="/admin/activity/manual" className="border rounded p-4 hover:bg-foreground/5">Manual Activity Entry</Link>
        <button onClick={openDemo} className="border rounded p-4 text-left hover:bg-foreground/5">
          Open Demo Kiosk (new window)
          <div className="text-sm text-foreground/70 mt-1">Uses real flows, no QR enrollment; writes to real database.</div>
        </button>
      </div>
    </div>
  );
}
