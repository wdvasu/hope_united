export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import Link from 'next/link';
import { FilterBar } from './FilterBar';

type SearchParams = {
  start?: string;
  end?: string;
  county?: string;
  page?: string;
  pageSize?: string;
};

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const pageSize = Math.max(1, Math.min(200, Number(sp.pageSize ?? '25')));
  const page = Math.max(1, Number(sp.page ?? '1'));
  const start = sp.start ? new Date(sp.start) : null;
  const end = sp.end ? new Date(sp.end) : null;
  if (end) end.setHours(23,59,59,999);

  const where: Record<string, unknown> = {};
  if (start || end) where.createdAt = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
  if (sp.county) where.county = sp.county;
  // drug filter removed

  const regs = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize + 1, // sentinel for next page
  });
  const hasNext = regs.length > pageSize;
  const rows = hasNext ? regs.slice(0, pageSize) : regs;

  return (
    <div className="max-w-screen-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Recent Registrations</h1>
      <FilterBar start={sp.start} end={sp.end} county={sp.county} pageSize={pageSize} />
      <div className="flex items-center gap-2">
        <Link
          className="ml-auto px-3 py-2 rounded bg-black text-white"
          href={`/api/registrations/export?format=csv${searchParamsToQuery(sp)}`}
        >
          Download CSV
        </Link>
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-[1400px] text-sm whitespace-nowrap leading-tight">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left px-2 py-1">Created</th>
              <th className="text-left px-2 py-1">UID</th>
              <th className="text-left px-2 py-1">Full Name</th>
              <th className="text-left px-2 py-1">ZIP</th>
              <th className="text-left px-2 py-1">Veteran</th>
              {/** drug columns removed */}
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
              <th className="text-left px-2 py-1">E‑Sign Name</th>
              <th className="text-left px-2 py-1">E‑Sign At</th>
              <th className="text-left px-2 py-1">Device ID</th>
              <th className="text-left px-2 py-1">Created IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-2 py-1">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-2 py-1 font-mono">{r.uid}</td>
                <td className="px-2 py-1">{r.fullName}</td>
                <td className="px-2 py-1">{r.zipCode}</td>
                <td className="px-2 py-1">{r.veteranStatus}</td>
                {/** removed */}
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
                <td className="px-2 py-1">{r.eSignatureName}</td>
                <td className="px-2 py-1">{new Date(r.eSignatureAt).toLocaleString()}</td>
                <td className="px-2 py-1 font-mono">{r.deviceId}</td>
                <td className="px-2 py-1">{r.createdIp || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <div>Page {page}</div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link className="px-3 py-2 rounded border" href={`/admin/registrations${searchParamsToQuery({ ...sp, page: String(page - 1) })}`}>Prev</Link>
          )}
          {hasNext && (
            <Link className="px-3 py-2 rounded border" href={`/admin/registrations${searchParamsToQuery({ ...sp, page: String(page + 1) })}`}>Next</Link>
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
  // removed drug param
  if (sp.county) params.set('county', sp.county);
  if (sp.pageSize) params.set('pageSize', sp.pageSize);
  if (sp.page) params.set('page', sp.page!);
  const s = params.toString();
  return s ? `?${s}` : '';
}
