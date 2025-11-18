export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import Link from 'next/link';

type SearchParams = {
  start?: string;
  end?: string;
  drug?: string;
  county?: string;
  page?: string;
  pageSize?: string;
};

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: SearchParams }) {
  const pageSize = Math.max(1, Math.min(200, Number(searchParams.pageSize ?? '25')));
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const start = searchParams.start ? new Date(searchParams.start) : null;
  const end = searchParams.end ? new Date(searchParams.end) : null;
  if (end) end.setHours(23,59,59,999);

  const where: Record<string, unknown> = {};
  if (start || end) where.createdAt = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
  if (searchParams.county) where.county = searchParams.county;
  if (searchParams.drug) where.drugs = { has: searchParams.drug };

  const regs = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize + 1, // sentinel for next page
  });
  const hasNext = regs.length > pageSize;
  const rows = hasNext ? regs.slice(0, pageSize) : regs;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Recent Registrations</h1>
      <form className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-xs">Start</label>
          <input name="start" type="date" defaultValue={searchParams.start || ''} className="border rounded px-2 py-1" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs">End</label>
          <input name="end" type="date" defaultValue={searchParams.end || ''} className="border rounded px-2 py-1" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs">Drug</label>
          <select name="drug" defaultValue={searchParams.drug || ''} className="border rounded px-2 py-1">
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
          <select name="county" defaultValue={searchParams.county || ''} className="border rounded px-2 py-1">
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
        <Link className="px-3 py-2 rounded border" href="/admin/registrations">Reset</Link>
        <Link
          className="ml-auto px-3 py-2 rounded bg-black text-white"
          href={`/api/registrations/export?format=csv${searchParamsToQuery(searchParams)}`}
        >
          Download CSV
        </Link>
      </form>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">UID</th>
              <th className="text-left p-2">Full Name</th>
              <th className="text-left p-2">ZIP</th>
              <th className="text-left p-2">Veteran</th>
              <th className="text-left p-2">Drugs</th>
              <th className="text-left p-2">Drug Other</th>
              <th className="text-left p-2">Sexual Orientation</th>
              <th className="text-left p-2">Sexual Other</th>
              <th className="text-left p-2">Gender</th>
              <th className="text-left p-2">Gender Other</th>
              <th className="text-left p-2">Race</th>
              <th className="text-left p-2">Race Other</th>
              <th className="text-left p-2">Ethnicity</th>
              <th className="text-left p-2">County</th>
              <th className="text-left p-2">County Other</th>
              <th className="text-left p-2">Waiver Agreed</th>
              <th className="text-left p-2">E‑Sign Name</th>
              <th className="text-left p-2">E‑Sign At</th>
              <th className="text-left p-2">Device ID</th>
              <th className="text-left p-2">Created IP</th>
              <th className="text-left p-2">User Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2 font-mono">{r.uid}</td>
                <td className="p-2">{r.fullName}</td>
                <td className="p-2">{r.zipCode}</td>
                <td className="p-2">{r.veteranStatus}</td>
                <td className="p-2">{(r.drugs || []).join(', ')}</td>
                <td className="p-2">{r.drugOther || ''}</td>
                <td className="p-2">{r.sexualOrientation}</td>
                <td className="p-2">{r.sexualOther || ''}</td>
                <td className="p-2">{r.gender}</td>
                <td className="p-2">{r.genderOther || ''}</td>
                <td className="p-2">{r.race}</td>
                <td className="p-2">{r.raceOther || ''}</td>
                <td className="p-2">{r.ethnicity}</td>
                <td className="p-2">{r.county}</td>
                <td className="p-2">{r.countyOther || ''}</td>
                <td className="p-2">{r.waiverAgreed ? 'Yes' : 'No'}</td>
                <td className="p-2">{r.eSignatureName}</td>
                <td className="p-2">{new Date(r.eSignatureAt).toLocaleString()}</td>
                <td className="p-2 font-mono">{r.deviceId}</td>
                <td className="p-2">{r.createdIp || ''}</td>
                <td className="p-2 max-w-[320px] whitespace-pre-wrap break-words text-xs">{r.userAgent || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <div>Page {page}</div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link className="px-3 py-2 rounded border" href={`/admin/registrations${searchParamsToQuery({ ...searchParams, page: String(page - 1) })}`}>Prev</Link>
          )}
          {hasNext && (
            <Link className="px-3 py-2 rounded border" href={`/admin/registrations${searchParamsToQuery({ ...searchParams, page: String(page + 1) })}`}>Next</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function searchParamsToQuery(sp: SearchParams) {
  const params = new URLSearchParams();
  if (sp.start) params.set('start', sp.start);
  if (sp.end) params.set('end', sp.end);
  if (sp.drug) params.set('drug', sp.drug);
  if (sp.county) params.set('county', sp.county);
  if (sp.pageSize) params.set('pageSize', sp.pageSize);
  if (sp.page) params.set('page', sp.page!);
  const s = params.toString();
  return s ? `?${s}` : '';
}
