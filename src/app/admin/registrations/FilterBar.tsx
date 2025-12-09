"use client";
import { useRef, useState } from "react";

export function FilterBar({
  start,
  end,
  county,
  q,
  order,
  pageSize,
}: {
  start?: string;
  end?: string;
  county?: string;
  q?: string;
  order?: string;
  pageSize: number;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [qValue, setQValue] = useState(q || "");

  const submitNow = () => {
    if (!formRef.current) return;
    const pageInput = formRef.current.querySelector<HTMLInputElement>('input[name="page"]');
    if (pageInput) pageInput.value = "1";
    formRef.current.requestSubmit();
  };

  const onImmediateChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement> = () => {
    submitNow();
  };

  return (
    <form ref={formRef} className="flex flex-wrap gap-2 items-end" method="get" action="/admin/registrations">
      <input type="hidden" name="page" defaultValue="1" />
      <div className="flex flex-col">
        <label className="text-xs">Start</label>
        <input name="start" type="date" defaultValue={start || ''} onChange={onImmediateChange} className="border rounded px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs">End</label>
        <input name="end" type="date" defaultValue={end || ''} onChange={onImmediateChange} className="border rounded px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs">Search name</label>
        <input
          name="q"
          type="text"
          placeholder="Full name"
          value={qValue}
          onChange={(e) => setQValue(e.target.value)}
          className="border rounded px-2 py-1 w-56"
        />
      </div>
      {/* Drug filter removed per request */}
      <div className="flex flex-col">
        <label className="text-xs">County</label>
        <select name="county" defaultValue={county || ''} onChange={onImmediateChange} className="border rounded px-2 py-1">
          <option value="">Any</option>
          <option value="SUMMIT">Summit</option>
          <option value="STARK">Stark</option>
          <option value="PORTAGE">Portage</option>
          <option value="CUYAHOGA">Cuyahoga</option>
          <option value="OTHER_OH_COUNTY">Other OH County</option>
          <option value="OUT_OF_STATE">Out of State</option>
          <option value="REFUSED">Refused</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs">Sort</label>
        <select name="order" defaultValue={order || 'created_desc'} onChange={onImmediateChange} className="border rounded px-2 py-1">
          <option value="created_desc">Created — Newest</option>
          <option value="created_asc">Created — Oldest</option>
          <option value="fullName_asc">Name — A→Z</option>
          <option value="fullName_desc">Name — Z→A</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs">Page size</label>
        <input name="pageSize" type="number" min={1} max={200} defaultValue={String(pageSize)} onChange={onImmediateChange} className="border rounded px-2 py-1 w-24" />
      </div>
      <button className="px-3 py-2 rounded bg-black text-white" type="submit">Apply</button>
      <a className="px-3 py-2 rounded border" href="/admin/registrations">Reset</a>
    </form>
  );
}
