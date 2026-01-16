export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
type Reg = {
  id: string;
  createdAt: Date;
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
  eSignatureAt: Date;
  deviceId: string | null;
  createdIp: string | null;
  eSignatureImage: string | null;
};
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
  q?: string;
  order?: 'created_desc' | 'created_asc' | 'fullName_asc' | 'fullName_desc';
};

export default async function AdminRegistrationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const pageSize = Math.max(1, Math.min(200, Number(sp.pageSize ?? '25')));
  const page = Math.max(1, Number(sp.page ?? '1'));
  const start = sp.start ? new Date(sp.start) : null;
  const end = sp.end ? new Date(sp.end) : null;
  if (end) end.setHours(23,59,59,999);

  const where: { [key: string]: unknown } & { fullName?: { contains: string; mode: 'insensitive' } } = {};
  if (start || end) where.createdAt = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
  if (sp.county) where.county = sp.county;
  if (sp.q && sp.q.trim()) where.fullName = { contains: sp.q.trim(), mode: 'insensitive' };
  // drug filter removed

  const order = sp.order || 'created_desc';
  const orderBy =
    order === 'created_asc' ? { createdAt: 'asc' as const } :
    order === 'fullName_asc' ? { fullName: 'asc' as const } :
    order === 'fullName_desc' ? { fullName: 'desc' as const } :
    { createdAt: 'desc' as const };

  const regs = await prisma.registration.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize + 1, // sentinel for next page
  });
  const hasNext = regs.length > pageSize;
  const rows = hasNext ? regs.slice(0, pageSize) : regs;
  const clientRows = rows.map((r: Reg) => ({
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
      <FilterBar start={sp.start} end={sp.end} county={sp.county} q={sp.q} order={sp.order} pageSize={pageSize} />
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
  if (sp.q) params.set('q', sp.q);
  if (sp.order) params.set('order', sp.order);
  const s = params.toString();
  return s ? `?${s}` : '';
}
