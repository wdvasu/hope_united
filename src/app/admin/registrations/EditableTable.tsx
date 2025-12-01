"use client";

import { useState } from 'react';

type RegRow = {
  id: string;
  createdAt: string;
  uid: string;
  fullName: string;
  birthYear: number | null;
  zipCode: string;
  veteranStatus: string;
  sexualOrientation: string;
  sexualOther: string | null;
  gender: string;
  genderOther: string | null;
  race: string;
  raceOther: string | null;
  ethnicity: string;
  county: string;
  countyOther: string | null;
  waiverAgreed: boolean;
  eSignatureAt: string;
  deviceId: string;
  createdIp: string | null;
  eSignatureImage?: string | null;
};

export function EditableTable({ rows: initialRows }: { rows: RegRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<RegRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const closeToast = () => setToast(null);

  const onSave = async (payload: Partial<RegRow> & { id: string }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/registrations/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to save');
      // merge into local state
      setRows(prev => prev.map(r => (r.id === payload.id ? { ...r, ...payload } as RegRow : r)));
      setEditing(null);
      setToast({ type: 'success', msg: 'Saved' });
      setTimeout(closeToast, 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setToast({ type: 'error', msg });
      setTimeout(closeToast, 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-[1200px] text-sm whitespace-nowrap leading-tight">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left px-2 py-1">Created</th>
              <th className="text-left px-2 py-1">UID</th>
              <th className="text-left px-2 py-1">Full Name</th>
              <th className="text-left px-2 py-1">Birth Year</th>
              <th className="text-left px-2 py-1">ZIP</th>
              <th className="text-left px-2 py-1">Veteran</th>
              <th className="text-left px-2 py-1">Sexual Orientation</th>
              <th className="text-left px-2 py-1">Sexual Other</th>
              <th className="text-left px-2 py-1">Gender</th>
              <th className="text-left px-2 py-1">Gender Other</th>
              <th className="text-left px-2 py-1">Race</th>
              <th className="text-left px-2 py-1">Race Other</th>
              <th className="text-left px-2 py-1">Ethnicity</th>
              <th className="text-left px-2 py-1">County</th>
              <th className="text-left px-2 py-1">County Other</th>
              <th className="text-left px-2 py-1">Waiver Agreed</th>
              <th className="text-left px-2 py-1">Signature</th>
              <th className="text-left px-2 py-1">E‑Sign At</th>
              <th className="text-left px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-2 py-1 font-mono">{r.uid}</td>
                <td className="px-2 py-1">{r.fullName}</td>
                <td className="px-2 py-1">{r.birthYear ?? ''}</td>
                <td className="px-2 py-1">{r.zipCode}</td>
                <td className="px-2 py-1">{r.veteranStatus}</td>
                <td className="px-2 py-1">{r.sexualOrientation}</td>
                <td className="px-2 py-1">{r.sexualOther || ''}</td>
                <td className="px-2 py-1">{r.gender}</td>
                <td className="px-2 py-1">{r.genderOther || ''}</td>
                <td className="px-2 py-1">{r.race}</td>
                <td className="px-2 py-1">{r.raceOther || ''}</td>
                <td className="px-2 py-1">{r.ethnicity}</td>
                <td className="px-2 py-1">{r.county}</td>
                <td className="px-2 py-1">{r.countyOther || ''}</td>
                <td className="px-2 py-1">{r.waiverAgreed ? 'Yes' : 'No'}</td>
                <td className="px-2 py-1">{r.eSignatureImage ? <a className="underline text-indigo-600" href={`/api/registrations/signature/${r.id}`} target="_blank" rel="noreferrer">View</a> : ''}</td>
                <td className="px-2 py-1">{new Date(r.eSignatureAt).toLocaleString()}</td>
                <td className="px-2 py-1">
                  <button className="px-2 py-1 rounded border" onClick={()=>setEditing(r)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          row={editing}
          onClose={()=>setEditing(null)}
          onSave={onSave}
          saving={saving}
        />
      )}

      {toast && (
        <div className={`fixed top-4 right-4 px-3 py-2 rounded shadow text-white ${toast.type==='success'?'bg-green-600':'bg-red-600'}`}>{toast.msg}</div>
      )}
    </>
  );
}

function EditModal({ row, onClose, onSave, saving }: { row: RegRow; onClose: ()=>void; onSave: (p: Partial<RegRow> & { id: string })=>void; saving: boolean; }) {
  const [fullName, setFullName] = useState(row.fullName);
  const [birthYear, setBirthYear] = useState(row.birthYear ? String(row.birthYear) : '');
  const [zipCode, setZipCode] = useState(row.zipCode);
  const [veteranStatus, setVeteranStatus] = useState(row.veteranStatus);
  const [sexualOrientation, setSexualOrientation] = useState(row.sexualOrientation);
  const [sexualOther, setSexualOther] = useState(row.sexualOther || '');
  const [gender, setGender] = useState(row.gender);
  const [genderOther, setGenderOther] = useState(row.genderOther || '');
  const [race, setRace] = useState(row.race);
  const [raceOther, setRaceOther] = useState(row.raceOther || '');
  const [ethnicity, setEthnicity] = useState(row.ethnicity);
  const [county, setCounty] = useState(row.county);
  const [countyOther, setCountyOther] = useState(row.countyOther || '');

  const canSave = fullName.trim().length>0 && /^\d{5}$/.test(zipCode) && (birthYear==='' || /^\d{4}$/.test(birthYear));

  const submit = () => {
    const payload: Partial<RegRow> & { id: string } = {
      id: row.id,
      fullName,
      zipCode,
      birthYear: birthYear ? Number(birthYear) : null,
      veteranStatus,
      sexualOrientation,
      sexualOther: sexualOrientation === 'OTHER' ? (sexualOther || null) : null,
      gender,
      genderOther: gender === 'OTHER' ? (genderOther || null) : null,
      race,
      raceOther: race === 'OTHER' ? (raceOther || null) : null,
      ethnicity,
      county,
      countyOther: county === 'OTHER_OH_COUNTY' ? (countyOther || null) : null,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[min(92vw,900px)] max-h-[85vh] overflow-auto rounded-lg bg-background text-foreground shadow-lg border border-foreground/20 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold">Edit Registration</h3>
          <button type="button" onClick={onClose} className="px-3 py-1 rounded border">Close</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Full Name"><input className="w-full border rounded px-3 py-2" value={fullName} onChange={e=>setFullName(e.target.value)} /></Labeled>
          <Labeled label="Birth Year"><input className="w-full border rounded px-3 py-2" value={birthYear} inputMode="numeric" onChange={e=>setBirthYear(e.target.value.replace(/[^0-9]/g,'').slice(0,4))} /></Labeled>
          <Labeled label="ZIP"><input className="w-full border rounded px-3 py-2" value={zipCode} inputMode="numeric" onChange={e=>setZipCode(e.target.value.replace(/[^0-9]/g,'').slice(0,5))} /></Labeled>

          <Labeled label="Veteran">
            <Select value={veteranStatus} onChange={setVeteranStatus} options={["YES","NO","REFUSED"]} />
          </Labeled>

          <Labeled label="Sexual Orientation">
            <Select value={sexualOrientation} onChange={setSexualOrientation} options={["HETEROSEXUAL","GAY_LESBIAN","BISEXUAL","OTHER","REFUSED"]} />
          </Labeled>
          {sexualOrientation==='OTHER' && (
            <Labeled label="Sexual Other"><input className="w-full border rounded px-3 py-2" value={sexualOther} onChange={e=>setSexualOther(e.target.value)} /></Labeled>
          )}

          <Labeled label="Gender">
            <Select value={gender} onChange={setGender} options={["FEMALE","MALE","TRANSGENDER","NON_BINARY","OTHER","REFUSED"]} />
          </Labeled>
          {gender==='OTHER' && (
            <Labeled label="Gender Other"><input className="w-full border rounded px-3 py-2" value={genderOther} onChange={e=>setGenderOther(e.target.value)} /></Labeled>
          )}

          <Labeled label="Race">
            <Select value={race} onChange={setRace} options={["WHITE","BLACK_AFRICAN_AMERICAN","ASIAN","AMERICAN_INDIAN_ALASKA_NATIVE","NATIVE_HAWAIIAN_PACIFIC_ISLANDER","OTHER","REFUSED"]} />
          </Labeled>
          {race==='OTHER' && (
            <Labeled label="Race Other"><input className="w-full border rounded px-3 py-2" value={raceOther} onChange={e=>setRaceOther(e.target.value)} /></Labeled>
          )}

          <Labeled label="Ethnicity">
            <Select value={ethnicity} onChange={setEthnicity} options={["HISPANIC_LATINO","NOT_HISPANIC_LATINO","REFUSED"]} />
          </Labeled>

          <Labeled label="County">
            <Select value={county} onChange={setCounty} options={["SUMMIT","STARK","PORTAGE","CUYAHOGA","OTHER_OH_COUNTY","OUT_OF_STATE","REFUSED"]} />
          </Labeled>
          {county==='OTHER_OH_COUNTY' && (
            <Labeled label="County Other"><input className="w-full border rounded px-3 py-2" value={countyOther} onChange={e=>setCountyOther(e.target.value)} /></Labeled>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="px-3 py-2 rounded border" onClick={onClose}>Cancel</button>
          <button type="button" className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" disabled={!canSave || saving} onClick={submit}>{saving?'Saving…':'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <div className="text-sm text-foreground/70">{label}</div>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string)=>void; options: string[] }) {
  return (
    <select className="w-full border rounded px-3 py-2 bg-background" value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
