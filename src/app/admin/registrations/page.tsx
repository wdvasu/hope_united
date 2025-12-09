export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import Link from 'next/link';
import { FilterBar } from './FilterBar';
import { EditableTable } from './EditableTable';
import { ImportBox } from './ImportBox';

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
  const clientRows = rows.map(r => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    uid: r.uid,
    fullName: r.fullName,
    birthYear: r.birthYear ?? null,
    zipCode: r.zipCode,
    veteranStatus: r.veteranStatus,
    sexualOrientation: r.sexualOrientation,
    sexualOther: r.sexualOther ?? null,
    gender: r.gender,
    genderOther: r.genderOther ?? null,
    race: r.race,
    raceOther: r.raceOther ?? null,
    ethnicity: r.ethnicity,
    county: r.county,
    countyOther: r.countyOther ?? null,
    waiverAgreed: r.waiverAgreed,
    eSignatureAt: r.eSignatureAt.toISOString(),
    deviceId: r.deviceId,
    createdIp: r.createdIp ?? null,
    eSignatureImage: r.eSignatureImage ?? null,
  }));

  return (
    <div className="max-w-screen-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Registrations</h1>
      <ImportBox />
      <FilterBar start={sp.start} end={sp.end} county={sp.county} pageSize={pageSize} />
      <div className="flex items-center gap-2">
        <Link
          className="ml-auto px-3 py-2 rounded bg-black text-white"
          href={`/api/registrations/export?format=csv${searchParamsToQuery(sp)}`}
        >
          Download CSV
        </Link>
      </div>
      <EditableTable rows={clientRows} />
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
