"use client";

import { useState } from 'react';

export function ImportBox() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ total: number; inserted: number; skipped: number; errors?: Array<{ row: number; reason: string; fullName?: string; zip?: string }>; } | null>(null);
  const [busy, setBusy] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const inputId = 'import-file-input';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (replaceExisting) fd.append('replaceExisting', '1');
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
        <label className="flex items-center gap-2 text-sm text-foreground/80 ml-2">
          <input type="checkbox" checked={replaceExisting} onChange={e=>setReplaceExisting(e.target.checked)} />
          <span>Replace existing (match: Name + ZIP{` `}
            <span className="text-foreground/60">[+ Birth Year if provided]</span>)
          </span>
        </label>
        <button
          type="submit"
          disabled={!file || busy}
          className={`px-3 py-2 rounded disabled:opacity-50 ${file && !busy ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border bg-white text-foreground/60'}`}
        >
          {busy? 'Importing…' : 'Import'}
        </button>
        {result && (
          <div className="text-sm text-foreground/70 flex items-center gap-3">
            <span>Imported {result.inserted} of {result.total}. Skipped {result.skipped}.</span>
            {!!result.errors?.length && (
              <>
                <button
                  type="button"
                  className="px-2 py-1 rounded border bg-white hover:bg-zinc-50"
                  onClick={() => {
                    const rows = [
                      ['Row','Reason','Full Name','ZIP'],
                      ...result.errors!.map(e => [String(e.row), e.reason, e.fullName || '', e.zip || ''])
                    ];
                    const csv = rows.map(r => r.map(v => '"' + String(v).replaceAll('"','""') + '"').join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'import-skipped-rows.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download skipped rows CSV
                </button>
              </>
            )}
          </div>
        )}
      </form>
      <div className="text-xs text-foreground/60 mt-2">
        Expected columns (case-insensitive, extra columns ignored): Full Name, Date of Birth, Zip, Veteran Status, Orientation/Identity, Gender, Race, Ethnicity, County, Created Date.
      </div>
    </div>
  );
}
