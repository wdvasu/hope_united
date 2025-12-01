"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const nav = window.navigator as unknown as { standalone?: boolean };
    const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches || !!nav.standalone;
    if (isStandalone) {
      // If launched from Home Screen, go to the choice screen
      window.location.replace("/start");
    }
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <main className="w-full max-w-xl space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Hope United</h1>
        <p className="text-zinc-600">Choose an action to begin.</p>
        <div className="flex flex-col gap-3">
          <a className="px-4 py-3 rounded bg-black text-white" href="/register">Open Registration Form</a>
          <a className="px-4 py-3 rounded border" href="/login">Tablet Login</a>
          <a className="px-4 py-3 rounded border" href="/admin/enroll">Admin: Enroll Tablet</a>
          <a className="px-4 py-3 rounded border" href="/admin/registrations">Admin: View Registrations</a>
        </div>
      </main>
    </div>
  );
}
