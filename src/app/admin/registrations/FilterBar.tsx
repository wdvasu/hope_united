"use client";
import { useRef } from "react";

export function FilterBar({
  start,
  end,
  drug,
  county,
  pageSize,
}: {
  start?: string;
  end?: string;
  drug?: string;
  county?: string;
  pageSize: number;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const onChange = () => {
    if (!formRef.current) return;
    // Always go back to page 1 when filters change
    const pageInput = formRef.current.querySelector<HTMLInputElement>('input[name="page"]');
    if (pageInput) pageInput.value = "1";
    formRef.current.requestSubmit();
  };
  return (
    <form ref={formRef} className="flex flex-wrap gap-2 items-end" method="get" action="/admin/registrations" onChange={onChange}>
      <input type="hidden" name="page" defaultValue="1" />
      <div className="flex flex-col">
        <label className="text-xs">Start</label>
        <input name="start" type="date" defaultValue={start || ''} className="border rounded px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs">End</label>
        <input name="end" type="date" defaultValue={end || ''} className="border rounded px-2 py-1" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs">Drug</label>
        <select name="drug" defaultValue={drug || ''} className="border rounded px-2 py-1">
          <option value="">Any</option>
          <option value="ALCOHOL">Alcohol</option>
          <option value="OPIOIDS_HEROIN">Opioids/Heroin</option>
          <option value="COCAINE_CRACK">Cocaine/Crack</option>
          <option value="METHAMPHETAMINE">Methamphetamine</option>
          <option value="MARIJUANA">Marijuana</option>
          <option value="OTHER">Other</option>
          <option value="REFUSED">Refused</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs">County</label>
        <select name="county" defaultValue={county || ''} className="border rounded px-2 py-1">
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
        <label className="text-xs">Page size</label>
        <input name="pageSize" type="number" min={1} max={200} defaultValue={String(pageSize)} className="border rounded px-2 py-1 w-24" />
      </div>
      <button className="px-3 py-2 rounded bg-black text-white" type="submit">Apply</button>
      <a className="px-3 py-2 rounded border" href="/admin/registrations">Reset</a>
    </form>
  );
}
