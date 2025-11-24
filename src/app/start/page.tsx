"use client";
import Link from "next/link";

export default function StartPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <main className="w-full max-w-2xl space-y-8 text-center text-[18px]">
        <h1 className="text-3xl font-semibold">What would you like to do?</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/register"
            className="block rounded-xl border border-foreground/20 px-6 py-8 hover:bg-foreground/5"
          >
            <div className="text-2xl font-medium mb-2">Registration</div>
            <div className="text-foreground/70">Start a new participant registration</div>
          </Link>
          <Link
            href="/activity"
            className="block rounded-xl border border-foreground/20 px-6 py-8 hover:bg-foreground/5"
          >
            <div className="text-2xl font-medium mb-2">Daily Activity</div>
            <div className="text-foreground/70">Record a daily activity entry</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
