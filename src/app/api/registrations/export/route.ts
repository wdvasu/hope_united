import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  // Simple last 1000 export for now
  const regs = await prisma.registration.findMany({ orderBy: { createdAt: 'desc' }, take: 1000 });

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
