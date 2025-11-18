import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  // Optional filters
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const drug = searchParams.get('drug');
  const county = searchParams.get('county');

  const where: Record<string, unknown> = {};
  if (start || end) {
    const s = start ? new Date(start) : undefined;
    const e = end ? new Date(end) : undefined;
    if (e) e.setHours(23,59,59,999);
    where.createdAt = { ...(s ? { gte: s } : {}), ...(e ? { lte: e } : {}) };
  }
  if (county) where.county = county;
  if (drug) where.drugs = { has: drug };

  const regs = await prisma.registration.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5000 });

  if (format === 'csv') {
    const header = [
      'createdAt','uid','fullName','zipCode','veteranStatus','drugs','drugOther','sexualOrientation','sexualOther','gender','genderOther','race','raceOther','ethnicity','county','countyOther','waiverAgreed','eSignatureName','eSignatureAt','deviceId','createdIp','userAgent'
    ];
    const rows = regs.map(r => [
      r.createdAt.toISOString(), r.uid, r.fullName, r.zipCode, r.veteranStatus,
      (r.drugs||[]).join('; '), r.drugOther||'', r.sexualOrientation, r.sexualOther||'', r.gender, r.genderOther||'', r.race, r.raceOther||'', r.ethnicity, r.county, r.countyOther||'', String(r.waiverAgreed), r.eSignatureName, r.eSignatureAt.toISOString(), r.deviceId, r.createdIp||'', r.userAgent||''
    ].map(v => typeof v === 'string' ? `"${v.replaceAll('"','""')}"` : v).join(','));
    const body = [header.join(','), ...rows].join('\n');
    return new NextResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="registrations.csv"' } });
  }

  return NextResponse.json(regs);
}
