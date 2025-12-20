import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  registrationId: z.string().min(1),
  categories: z.array(z.string().min(1).max(100)).min(1),
  at: z.string().transform((s) => new Date(s)),
  notes: z.string().max(2000).nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const createdIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  const data = parsed.data.categories.map((c) => ({
    deviceId: session.deviceId,
    category: c,
    createdAt: parsed.data.at,
    createdIp: createdIp || null,
    userAgent: userAgent || null,
    registrationId: parsed.data.registrationId,
    notes: parsed.data.notes ?? null,
  }));

  const result = await prisma.activity.createMany({ data });
  return NextResponse.json({ ok: true, count: result.count });
}
