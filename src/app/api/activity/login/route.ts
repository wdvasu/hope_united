import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  // If client already resolved to a specific registration ID
  if (body.selectedId) {
    const id = String(body.selectedId);
    const exists = await prisma.registration.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'Selection invalid' }, { status: 400 });
    const cookieStore = await cookies();
    cookieStore.set('attendee', id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
    return NextResponse.json({ ok: true });
  }
  const firstName = String(body.firstName || '').trim();
  const lastInitial = String(body.lastInitial || '').trim().slice(0,1);
  const birthYear = Number(body.birthYear);
  if (!firstName || !lastInitial || !Number.isInteger(birthYear)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  // Fetch candidates by year, then match in JS using stored fields or derivation from fullName
  const candidates = await prisma.registration.findMany({
    where: { birthYear },
    select: { id: true, fullName: true, zipCode: true, createdAt: true, firstName: true, lastInitial: true },
  });
  const fi = firstName.toLowerCase();
  const li = lastInitial.toLowerCase();
  try {
    console.log('[activity/login] input', { firstName, lastInitial, birthYear });
    console.log('[activity/login] candidates', candidates.length, candidates.map(r => ({ id: r.id, firstName: r.firstName, lastInitial: r.lastInitial, fullName: r.fullName })));
  } catch {}
  const matches = candidates.filter(r => {
    const parts = r.fullName.trim().split(/\s+/);
    const fn = (r.firstName || parts[0] || '').toLowerCase();
    const last = parts.length ? parts[parts.length - 1] : '';
    const storedLi = r.lastInitial ? r.lastInitial[0] : '';
    const liDerived = (storedLi || (last ? last[0] : '')).toLowerCase();
    return fn === fi && liDerived === li;
  });
  try { console.log('[activity/login] matches', matches.length, matches.map(m => m.id)); } catch {}
  if (matches.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (matches.length > 1) {
    const options = matches
      .sort((a,b) => a.fullName.localeCompare(b.fullName))
      .map(m => ({ id: m.id, label: `${m.fullName}${m.zipCode ? ` • ${m.zipCode}` : ''}` }));
    return NextResponse.json({ conflict: true, options }, { status: 409 });
  }
  const r = matches[0];
  const cookieStore = await cookies();
  cookieStore.set('attendee', r.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
  return NextResponse.json({ ok: true });
}
