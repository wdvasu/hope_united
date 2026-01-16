import { NextResponse } from 'next/server';
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
  eSignatureName: string | null;
  deviceId: string | null;
  createdIp: string | null;
  eSignatureImage: string | null;
  userAgent: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  // Optional filters
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const county = searchParams.get('county');
  const q = searchParams.get('q');
  const order = searchParams.get('order') as
    | 'created_desc' | 'created_asc' | 'fullName_asc' | 'fullName_desc' | null;

  const where: { [key: string]: unknown } & { fullName?: { contains: string; mode: 'insensitive' } } = {};
  if (start || end) {
    const s = start ? new Date(start) : undefined;
    const e = end ? new Date(end) : undefined;
    if (e) e.setHours(23,59,59,999);
    where.createdAt = { ...(s ? { gte: s } : {}), ...(e ? { lte: e } : {}) };
  }
  if (county) where.county = county;
  if (q) where.fullName = { contains: q, mode: 'insensitive' };
  const orderBy =
    order === 'created_asc' ? { createdAt: 'asc' as const } :
    order === 'fullName_asc' ? { fullName: 'asc' as const } :
    order === 'fullName_desc' ? { fullName: 'desc' as const } :
    { createdAt: 'desc' as const };

  const regs = await prisma.registration.findMany({ where, orderBy, take: 5000 });

  if (format === 'csv') {
    const header = [
      'createdAt','uid','fullName','birthYear','zipCode','veteranStatus','sexualOrientation','sexualOther','gender','genderOther','race','raceOther','ethnicity','county','countyOther','waiverAgreed','eSignatureName','eSignatureAt','deviceId','createdIp','userAgent'
    ];
    const rows = regs.map((r: Reg) => [
      r.createdAt.toISOString(), r.uid, r.fullName, r.birthYear ?? '', r.zipCode, r.veteranStatus,
      r.sexualOrientation, r.sexualOther||'', r.gender, r.genderOther||'', r.race, r.raceOther||'', r.ethnicity, r.county, r.countyOther||'', String(r.waiverAgreed), r.eSignatureName||'', r.eSignatureAt.toISOString(), r.deviceId||'', r.createdIp||'', r.userAgent||''
    ].map(v => typeof v === 'string' ? `"${v.replaceAll('"','""')}"` : v).join(','));
    const body = [header.join(','), ...rows].join('\n');
    return new NextResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="registrations.csv"' } });
  }

  return NextResponse.json(regs);
}
