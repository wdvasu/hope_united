"use client";

import { useState } from 'react';

export function ImportBox() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ total: number; inserted: number; skipped: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const inputId = 'import-file-input';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/registrations/import', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Import failed');
      setResult(j);
    } catch (e) {
      alert((e as Error).message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border rounded p-4 bg-zinc-50/50">
      <h2 className="font-medium mb-2">Import Registrations (CSV or Excel)</h2>
      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={e=>setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor={inputId} className="px-3 py-2 rounded bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700">
          {file ? 'Change file' : 'Choose file'}
        </label>
        <span className="text-sm text-foreground/70 min-w-[200px] truncate">
          {file ? file.name : 'No file selected'}
        </span>
        <button type="submit" disabled={!file || busy} className="px-3 py-2 rounded border bg-white disabled:opacity-50">
          {busy? 'Importing…' : 'Import'}
        </button>
        {result && (
          <div className="text-sm text-foreground/70">Imported {result.inserted} of {result.total}. Skipped {result.skipped}.</div>
        )}
      </form>
      <div className="text-xs text-foreground/60 mt-2">
        Expected columns (case-insensitive, extra columns ignored): Full Name, Date of Birth, Zip, Veteran Status, Orientation/Identity, Gender, Race, Ethnicity, County, Created Date.
      </div>
    </div>
  );
}
